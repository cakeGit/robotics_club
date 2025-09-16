import { handleListImages } from "../../lib/api/apiHandlers.js";

export default async function handler(req, res) {
    if (req.method === "GET") {
        const result = await handleListImages();

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(500).json(result);
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}
