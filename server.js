const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Load license list
let licenses = JSON.parse(fs.readFileSync("licenses.json", "utf-8"));

// API kiểm tra license
app.post("/api/verify", (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ valid: false, message: "No name provided" });

    const license = licenses.find(l => l.name.toLowerCase() === name.toLowerCase());
    if (!license) return res.json({ valid: false, message: "Not found" });

    const now = Date.now();
    const expiry = new Date(license.expiresAt).getTime();

    res.json({
        valid: expiry > now,
        expiresAt: license.expiresAt
    });
});

// API thêm/cập nhật license
app.post("/api/add", (req, res) => {
    const { name, expiresAt } = req.body;
    if (!name || !expiresAt) return res.status(400).json({ message: "Missing data" });

    const existing = licenses.find(l => l.name.toLowerCase() === name.toLowerCase());
    if (existing) {
        existing.expiresAt = expiresAt;
    } else {
        licenses.push({ name, expiresAt });
    }

    fs.writeFileSync("licenses.json", JSON.stringify(licenses, null, 2));
    res.json({ message: "License added/updated" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`License API running on port ${PORT}`));
