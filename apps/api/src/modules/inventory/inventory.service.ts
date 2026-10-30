import { InventoryDay, IInventoryDay } from '../../models/InventoryDay.js';
import { RoomCategory } from '../../models/RoomCategory.js';
import { Hotel } from '../../models/Hotel.js';
import { getStayDates } from '../../utils/date.js';

export interface NightPriceInfo {
  date: string;
  priceCents: number;
  availableRooms: number;
}

export interface AvailabilityResult {
  isAvailable: boolean;
  minAvailableRooms: number;
  nightlyRates: NightPriceInfo[];
  subtotalCents: number;
  taxPercent: number;
  taxCents: number;
  cleaningFeeCents: number;
  totalCents: number;
  currency: string;
}

export class InventoryService {
  /**
   * Calculates availability, capacity, and accurate pricing snapshot for a specific room category and date range.
   */
  async checkCategoryAvailability(
    hotelId: string,
    roomCategoryId: string,
    checkInDateStr: string,
    checkOutDateStr: string
  ): Promise<AvailabilityResult> {
    const dates = getStayDates(checkInDateStr, checkOutDateStr);
    const category = await RoomCategory.findOne({ _id: roomCategoryId, hotelId, isActive: true });
    if (!category) {
      const err: any = new Error('Room category not found.');
      err.statusCode = 404;
      throw err;
    }

    const hotel = await Hotel.findById(hotelId);
    const taxPercent = hotel?.policies?.taxRatePercent || 12;
    const currency = hotel?.currency || 'USD';

    // Fetch inventory records for all dates in the stay
    const inventoryDocs = await InventoryDay.find({
      hotelId,
      roomCategoryId,
      date: { $in: dates },
    }).lean();

    const invMap = new Map<string, IInventoryDay>();
    inventoryDocs.forEach((doc) => invMap.set(doc.date, doc as unknown as IInventoryDay));

    let minAvailable = Infinity;
    let subtotalCents = 0;
    const nightlyRates: NightPriceInfo[] = [];

    for (const dateStr of dates) {
      const inv = invMap.get(dateStr);
      const total = inv ? inv.totalInventory : category.totalRooms;
      const booked = inv ? inv.bookedCount : 0;
      const held = inv ? inv.heldCount : 0;
      const available = Math.max(0, total - (booked + held));

      if (available < minAvailable) {
        minAvailable = available;
      }

      // Check for date-specific rate override or weekend rate multiplier
      let rateCents = inv?.priceCents || category.basePriceCents;
      const dayOfWeek = new Date(dateStr).getUTCDay();
      // Friday (5) and Saturday (6) weekend multiplier
      if (dayOfWeek === 5 || dayOfWeek === 6) {
        rateCents = Math.round(rateCents * (category.weekendMultiplier || 1.15));
      }

      subtotalCents += rateCents;
      nightlyRates.push({
        date: dateStr,
        priceCents: rateCents,
        availableRooms: available,
      });
    }

    const isAvailable = minAvailable > 0 && minAvailable !== Infinity;
    const taxCents = Math.round((subtotalCents * taxPercent) / 100);
    const cleaningFeeCents = 0; // Configurable per category
    const totalCents = subtotalCents + taxCents + cleaningFeeCents;

    return {
      isAvailable,
      minAvailableRooms: minAvailable === Infinity ? 0 : minAvailable,
      nightlyRates,
      subtotalCents,
      taxPercent,
      taxCents,
      cleaningFeeCents,
      totalCents,
      currency,
    };
  }

  /**
   * Search all available room categories for a hotel across a date range
   */
  async searchAvailableCategories(
    hotelId: string,
    checkInDate: string,
    checkOutDate: string,
    guests?: { adults?: number; children?: number }
  ) {
    const categoryQuery: any = { hotelId, isActive: true };
    if (guests?.adults) {
      categoryQuery.maxAdults = { $gte: guests.adults };
    }
    if (guests?.children) {
      categoryQuery.maxChildren = { $gte: guests.children };
    }

    const categories = await RoomCategory.find(categoryQuery).sort({ basePriceCents: 1 }).lean();
    const availableCategories: any[] = [];

    for (const cat of categories) {
      const availability = await this.checkCategoryAvailability(
        hotelId,
        cat._id.toString(),
        checkInDate,
        checkOutDate
      );

      if (availability.isAvailable) {
        availableCategories.push({
          category: cat,
          availability,
        });
      }
    }

    return availableCategories;
  }

  /**
   * Concurrency-safe atomic inventory hold across all nights in a stay.
   * If any night is unavailable, immediately rolls back any reserved nights and throws error.
   */
  async holdInventory(hotelId: string, roomCategoryId: string, dates: string[]): Promise<void> {
    const heldDates: string[] = [];

    try {
      for (const date of dates) {
        // Atomic conditional increment: only increment heldCount if (bookedCount + heldCount + 1) <= totalInventory
        let res = await InventoryDay.updateOne(
          {
            hotelId,
            roomCategoryId,
            date,
            $expr: {
              $lte: [{ $add: ['$bookedCount', '$heldCount', 1] }, '$totalInventory'],
            },
          },
          {
            $inc: { heldCount: 1 },
          }
        );

        if (res.matchedCount === 0) {
          // Check if record exists at all
          const exists = await InventoryDay.findOne({ hotelId, roomCategoryId, date });
          if (!exists) {
            // Provision record if missing from category capacity
            const category = await RoomCategory.findById(roomCategoryId);
            const total = category?.totalRooms || 5;
            try {
              await InventoryDay.create({
                hotelId,
                roomCategoryId,
                date,
                totalInventory: total,
                bookedCount: 0,
                heldCount: 1,
              });
              heldDates.push(date);
              continue;
            } catch (createErr: any) {
              // If concurrent request inserted the document first (E11000 duplicate key),
              // retry the atomic conditional increment on the now-existing record
              if (createErr.code === 11000) {
                res = await InventoryDay.updateOne(
                  {
                    hotelId,
                    roomCategoryId,
                    date,
                    $expr: {
                      $lte: [{ $add: ['$bookedCount', '$heldCount', 1] }, '$totalInventory'],
                    },
                  },
                  {
                    $inc: { heldCount: 1 },
                  }
                );
                if (res.matchedCount > 0) {
                  heldDates.push(date);
                  continue;
                }
              } else {
                throw createErr;
              }
            }
          }

          // Capacity was exceeded on this night!
          const err: any = new Error(
            `Insufficient inventory on night of ${date}. Room category is fully booked.`
          );
          err.statusCode = 409;
          err.code = 'INSUFFICIENT_INVENTORY';
          throw err;
        }

        heldDates.push(date);
      }
    } catch (error) {
      // Rollback any successfully held dates
      if (heldDates.length > 0) {
        await InventoryDay.updateMany(
          {
            hotelId,
            roomCategoryId,
            date: { $in: heldDates },
          },
          {
            $inc: { heldCount: -1 },
          }
        );
      }
      throw error;
    }
  }

  /**
   * Releases an expired or abandoned temporary hold
   */
  async releaseHold(hotelId: string, roomCategoryId: string, dates: string[]): Promise<void> {
    await InventoryDay.updateMany(
      {
        hotelId,
        roomCategoryId,
        date: { $in: dates },
        heldCount: { $gt: 0 },
      },
      {
        $inc: { heldCount: -1 },
      }
    );
  }

  /**
   * Atomically converts a held room into a confirmed booked room upon verified payment
   */
  async confirmHoldToBooked(
    hotelId: string,
    roomCategoryId: string,
    dates: string[]
  ): Promise<void> {
    await InventoryDay.updateMany(
      {
        hotelId,
        roomCategoryId,
        date: { $in: dates },
        heldCount: { $gt: 0 },
      },
      {
        $inc: { heldCount: -1, bookedCount: 1 },
      }
    );
  }

  /**
   * Releases inventory upon confirmed reservation cancellation
   */
  async releaseBookedInventory(
    hotelId: string,
    roomCategoryId: string,
    dates: string[]
  ): Promise<void> {
    await InventoryDay.updateMany(
      {
        hotelId,
        roomCategoryId,
        date: { $in: dates },
        bookedCount: { $gt: 0 },
      },
      {
        $inc: { bookedCount: -1 },
      }
    );
  }
}

export const inventoryService = new InventoryService();
