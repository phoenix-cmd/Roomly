import { Hotel, IHotel } from '../../models/Hotel.js';

export class HotelsService {
  async listHotels(query: { city?: string; limit?: number }): Promise<IHotel[]> {
    const filter: any = { isActive: true };
    if (query.city) {
      filter['address.city'] = new RegExp(query.city, 'i');
    }
    const limit = Math.min(query.limit || 20, 50);
    return (await Hotel.find(filter).limit(limit).lean()) as unknown as IHotel[];
  }

  async getHotelByIdOrSlug(identifier: string): Promise<IHotel> {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    const filter = isObjectId ? { _id: identifier } : { slug: identifier.toLowerCase() };

    const hotel = await Hotel.findOne({ ...filter, isActive: true }).lean();
    if (!hotel) {
      const err: any = new Error('Hotel property not found.');
      err.statusCode = 404;
      err.code = 'HOTEL_NOT_FOUND';
      throw err;
    }
    return hotel as unknown as IHotel;
  }

  async updateHotel(hotelId: string, updates: Partial<IHotel>): Promise<IHotel> {
    const hotel = await Hotel.findByIdAndUpdate(hotelId, { $set: updates }, { new: true });
    if (!hotel) {
      const err: any = new Error('Hotel not found.');
      err.statusCode = 404;
      throw err;
    }
    return hotel;
  }
}

export const hotelsService = new HotelsService();
