import { client } from "./client";
import { User } from "../models/user"


// LOOK INTO SQL MORE. IDRK all this
async function insertUser(user: User): Promise<void> {
    const query = `
        INSERT INTO users (user_uuid, long, lat)
        VALUES ($1, $2, $3)
        RETURNING user_id;
    `;
    const values = [user.userID, user.long, user.lat];

    try {
        const res = await client.query(query, values);
        console.log(`User added with ID: ${res.rows[0].user_id}`);
    } catch (err) {
        console.error('Error inserting user:', err);
    }
}

export { insertUser }