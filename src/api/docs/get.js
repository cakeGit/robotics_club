import { handleGetDocument } from "../../lib/api/apiHandlers";

export default async function handler(req, res) {
    if (req.method === "GET") {
        const { filePath } = req.query;

        if (!filePath) {
            return res
                .status(400)
                .json({ success: false, message: "File path is required" });
        }

        const result = await handleGetDocument(filePath);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(404).json(result);
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}
