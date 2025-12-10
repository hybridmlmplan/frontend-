// src/pages/pvbv/RenewalStatus.jsx
import React from "react";

/**
 * Plan: No renewal exists in system; this page purely shows explanatory message + PV summary link
 */
export default function RenewalStatus() {
  return (
    <div className="max-w-3xl mx-auto bg-white p-5 rounded shadow">
      <h2 className="text-xl font-bold mb-3">Renewal Status</h2>

      <p className="mb-3">
        <strong>Note:</strong> According to company policy, <em>there is no manual renewal</em>. The system uses the Silver package joining date as the renewal anchor for internal PV tracking,
        and the business uses an <strong>infinite red → green cycle</strong> model — packages do not expire and no manual renewal is required.
      </p>

      <ul className="list-disc pl-5 mb-3 text-sm text-gray-700">
        <li>PV is used only for binary pair matching and capped sessions.</li>
        <li>All rank, royalty and fund incomes are generated from BV (repurchase/products/services), not PV.</li>
        <li>When a package cycle completes (8 pairs), pairs reset to RED and can re-earn when matched again.</li>
      </ul>

      <p className="text-sm text-gray-600">
        If you need to view your PV/BV summary, go to the PV Summary page.
      </p>
    </div>
  );
}
