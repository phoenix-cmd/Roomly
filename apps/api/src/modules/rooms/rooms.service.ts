import { RoomCategory, IRoomCategory } from '../../models/RoomCategory.js';
import { Room, IRoom } from '../../models/Room.js';
import { InventoryDay } from '../../models/InventoryDay.js';
import { formatDateKey } from '../../utils/date.js';

export class RoomsService {
  async listCategories(
    hotelId: string,
    filters?: { adults?: number; children?: number; maxPrice?: number }
  ): Promise<IRoomCategory[]> {
    const query: any = { hotelId, isActive: true };

    if (filters?.adults) {
      query.maxAdults = { $gte: filters.adults };
    }
    if (filters?.children) {
      query.maxChildren = { $gte: filters.children };
    }
    if (filters?.maxPrice) {
      query.basePriceCents = { $lte: filters.maxPrice * 100 };
    }

    return (await RoomCategory.find(query).sort({ basePriceCents: 1 }).lean()) as unknown as IRoomCategory[];
  }

  async getCategoryByIdOrSlug(hotelId: string, identifier: string): Promise<IRoomCategory> {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    const filter = isObjectId
      ? { _id: identifier, hotelId, isActive: true }
      : { slug: identifier.toLowerCase(), hotelId, isActive: true };

    const category = await RoomCategory.findOne(filter).lean();
    if (!category) {
      const err: any = new Error('Room category not found.');
      err.statusCode = 404;
      err.code = 'CATEGORY_NOT_FOUND';
      throw err;
    }
    return category as unknown as IRoomCategory;
  }

  async createCategory(
    hotelId: string,
    data: Partial<IRoomCategory> & { initialPhysicalRoomsCount?: number }
  ): Promise<IRoomCategory> {
    const category = await RoomCategory.create({
      ...data,
      hotelId,
      slug: data.slug || data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    });

    // Automatically provision physical rooms if requested
    const count = data.initialPhysicalRoomsCount || data.totalRooms || 5;
    const physicalRooms: any[] = [];
    for (let i = 1; i <= count; i++) {
      physicalRooms.push({
        hotelId,
        roomCategoryId: category._id,
        roomNumber: `${100 + i}`,
        floor: 1,
        status: 'AVAILABLE',
      });
    }
    await Room.insertMany(physicalRooms);

    // Initialize 90 days of inventory allotments
    const today = new Date();
    const inventoryDocs: any[] = [];
    for (let d = 0; d < 90; d++) {
      const date = new Date(today);
      date.setUTCDate(today.getUTCDate() + d);
      inventoryDocs.push({
        hotelId,
        roomCategoryId: category._id,
        date: formatDateKey(date),
        totalInventory: count,
        bookedCount: 0,
        heldCount: 0,
        priceCents: category.basePriceCents,
      });
    }
    await InventoryDay.insertMany(inventoryDocs);

    return category;
  }

  async listPhysicalRooms(hotelId: string, categoryId?: string): Promise<IRoom[]> {
    const filter: any = { hotelId };
    if (categoryId) filter.roomCategoryId = categoryId;
    return (await Room.find(filter).populate('roomCategoryId', 'name slug basePriceCents').sort({ roomNumber: 1 }).lean()) as unknown as IRoom[];
  }
}

export const roomsService = new RoomsService();
