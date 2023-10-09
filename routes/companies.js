const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");
const slugify = require("slugify");
router.get("/", async (req, res, next) => {
  // Get list of companies
  try {
    const results = await db.query(`SELECT * FROM companies`);
    return res.json({ companies: results.rows });
  } catch (e) {
    next(e);
  }
});

router.get("/:code", async (req, res, next) => {
  // Get company with matching code and that companies invoices
  try {
    const { code } = req.params;
    const result = await db.query(`SELECT * FROM companies WHERE code = $1`, [
      code,
    ]);
    const invoices = await db.query(
      `SELECT * FROM invoices WHERE comp_code = $1`,
      [code]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(
        `Cannot locate company based on code ${code}`,
        404
      );
    }
    return res.json({ company: result.rows[0], invoices: invoices.rows });
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  // Create a new company
  try {
    const { name, description } = req.body;
    const code = slugify(name, {
      replacement: "",
      lower: true,
      strict: true,
    });
    const result = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *`,
      [code, name, description]
    );
    return res.status(201).json({ company: result.rows[0] });
  } catch (e) {
    next(e);
  }
});

router.put("/:code", async (req, res, next) => {
  // Update company information
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const result = await db.query(
      `UPDATE companies SET name = $1, description = $2 WHERE code = $3 RETURNING *`,
      [name, description, code]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(
        `Cannot locate company based on code ${code}`,
        404
      );
    }
    return res.json({ company: result.rows[0] });
  } catch (e) {
    next(e);
  }
});

router.delete("/:code", async (req, res, next) => {
  // Delete a company
  try {
    const { code } = req.params;
    const result = await db.query(
      `DELETE FROM companies WHERE code=$1 RETURNING code`,
      [code]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`No company found with code of: ${code}`, 404);
    }
    return res.send({ msg: "deleted company successfuly" });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
