import { hashPassword } from "../../../../utils/auth"; // Hashing utility
import connect from "../../../../utils/db"; // MongoClient utility

export async function POST(req) {
  const { name, email, password, role, department, position, NIK } =
    await req.json();

  const client = await connect();
  const usersCollection = client.collection("user");

  // Cek apakah email sudah terdaftar
  const existingUser = await usersCollection.findOne({ email });
  if (existingUser) {
    return new Response(JSON.stringify({ message: "User already exists" }), {
      status: 400,
    });
  }

  // Auto-generate users_ID
  const lastUser = await usersCollection
    .find({ users_ID: { $regex: /^USR\d{3}$/ } })
    .sort({ users_ID: -1 })
    .limit(1)
    .toArray();

  let newUsersID = "USR001"; // default jika belum ada user
  if (lastUser.length > 0) {
    const lastID = lastUser[0].users_ID; // contoh: USR007
    const lastNumber = parseInt(lastID.slice(3), 10); // ambil angka: 7
    const nextNumber = lastNumber + 1;
    newUsersID = "USR" + String(nextNumber).padStart(3, "0"); // jadi USR008
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Simpan user baru
  await usersCollection.insertOne({
    users_ID: newUsersID,
    name,
    department,
    position,
    NIK,
    email,
    password: hashedPassword,
    role,
  });

  return new Response(
    JSON.stringify({
      message: "User created successfully",
      users_ID: newUsersID,
    }),
    {
      status: 201,
    }
  );
}
