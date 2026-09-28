/**
 * VendorRiskTiering
 * Scores a vendor intake questionnaire and assigns a tier, which sets the
 * assessment depth and how often the vendor is reassessed. Certain answers
 * force Tier 1 regardless of score.
 */
var VendorRiskTiering = Class.create();
VendorRiskTiering.QUESTIONS = {
    data_access:        { none: 0, internal: 10, confidential: 25, customer_pii: 35 },
    system_access:      { none: 0, read_only: 10, privileged: 25 },
    business_critical:  { no: 0, yes: 20 },
    offshore_processing:{ no: 0, yes: 10 },
    subcontractors:     { no: 0, yes: 5 },
    soc2_report:        { yes: -10, no: 0 },
    annual_spend:       { under_100k: 0, '100k_1m': 5, over_1m: 10 }
};
VendorRiskTiering.TIERS = [
    { tier: 1, min: 60, assessment: 'Full security assessment + on-site/virtual audit', reassessMonths: 12 },
    { tier: 2, min: 30, assessment: 'Standard questionnaire + evidence review', reassessMonths: 24 },
    { tier: 3, min: 0, assessment: 'Lite questionnaire', reassessMonths: 36 }
];
VendorRiskTiering.prototype = {
    initialize: function () {},

    tier: function (answers) {
        var score = 0;
        var errors = [];
        var breakdown = {};
        Object.keys(VendorRiskTiering.QUESTIONS).forEach(function (q) {
            var opts = VendorRiskTiering.QUESTIONS[q];
            var a = answers[q];
            if (a === undefined) { errors.push('Missing answer: ' + q); return; }
            if (opts[a] === undefined) { errors.push('Invalid answer for ' + q + ': ' + a); return; }
            breakdown[q] = opts[a];
            score += opts[a];
        });
        if (errors.length) return { valid: false, errors: errors };
        score = Math.max(0, score);

        var forced = [];
        if (answers.data_access === 'customer_pii' && answers.soc2_report === 'no') forced.push('Customer PII without a SOC 2 report');
        if (answers.system_access === 'privileged' && answers.business_critical === 'yes') forced.push('Privileged access to a business-critical system');

        var t = VendorRiskTiering.TIERS.filter(function (x) { return score >= x.min; })[0];
        if (forced.length) t = VendorRiskTiering.TIERS[0];
        return {
            valid: true, score: score, tier: t.tier, assessment: t.assessment,
            reassessMonths: t.reassessMonths, forcedReasons: forced, breakdown: breakdown
        };
    },

    type: 'VendorRiskTiering'
};
