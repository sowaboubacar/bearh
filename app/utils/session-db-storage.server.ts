/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSessionStorage } from "@remix-run/node";
import { sessionService } from "~/services/session.service.server";

export function createDatabaseSessionStorage({ cookie }: { cookie: any }) {
  return createSessionStorage({
    cookie,
    async createData(data, expires) {
      return await sessionService.createSession(data, expires as Date);
    },

    async readData(id) {
      const data = await sessionService.getSession(id);
      return data ? JSON.parse(JSON.stringify(data)) : data; // Ensure plain object
    },

    async updateData(id, data, expires) {
      const plainData = JSON.parse(JSON.stringify(data)); // Remove internal properties
      await sessionService.updateSession(id, plainData, expires as Date);
    },

    async deleteData(id) {
      await sessionService.deleteSession(id);
    },
  });
}
