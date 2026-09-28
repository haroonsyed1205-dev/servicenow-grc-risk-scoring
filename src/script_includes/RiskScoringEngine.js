/**
 * RiskScoringEngine
 * Inherent risk = likelihood x impact (1-5 each, 1-25).
 * Residual risk = inherent reduced by the effectiveness of mapped controls.
 * Control reduction is capped, and ineffective or untested controls do not
 * count, so residual risk cannot look better than the evidence supports.
 */
var RiskScoringEngine = Class.create();
RiskScoringEngine.prototype = {
    initialize: function (opts) {
        var o = opts || {};
        this.bands = o.bands || [
            { min: 20, rating: 'critical' },
            { min: 12, rating: 'high' },
            { min: 6, rating: 'medium' },
            { min: 1, rating: 'low' }
        ];
        this.effectiveness = o.effectiveness || { effective: 0.5, partially_effective: 0.25, ineffective: 0, not_tested: 0 };
        this.maxReduction = o.maxReduction || 0.8;
        this.appetite = o.appetite || { default: 12 }; // residual score above this breaches appetite
        this.maxTestAgeDays = o.maxTestAgeDays || 365;
    },

    rating: function (score) {
        for (var i = 0; i < this.bands.length; i++) if (score >= this.bands[i].min) return this.bands[i].rating;
        return 'low';
    },

    score: function (risk, controls, todayIso) {
        var errs = [];
        ['likelihood', 'impact'].forEach(function (f) {
            var v = risk[f];
            if (!(v >= 1 && v <= 5 && Math.floor(v) === v)) errs.push(f + ' must be an integer 1-5');
        });
        if (errs.length) return { valid: false, errors: errs };

        var inherent = risk.likelihood * risk.impact;
        var remaining = 1;
        var notes = [];
        var self = this;
        (controls || []).forEach(function (c) {
            var eff = c.effectiveness;
            if (eff === 'effective' || eff === 'partially_effective') {
                if (!c.lastTested || (todayIso && self._days(c.lastTested, todayIso) > self.maxTestAgeDays)) {
                    notes.push(c.id + ': test evidence older than ' + self.maxTestAgeDays + ' days, not counted');
                    eff = 'not_tested';
                }
            }
            var r = self.effectiveness[eff] || 0;
            remaining = remaining * (1 - r); // controls reduce what is left, not the original
        });
        var reduction = Math.min(1 - remaining, this.maxReduction);
        var residual = Math.max(1, Math.round(inherent * (1 - reduction)));
        var limit = this.appetite[risk.category] !== undefined ? this.appetite[risk.category] : this.appetite['default'];

        return {
            valid: true,
            inherent: inherent,
            inherentRating: this.rating(inherent),
            residual: residual,
            residualRating: this.rating(residual),
            controlReductionPct: Math.round(reduction * 100),
            appetiteBreach: residual > limit,
            appetiteLimit: limit,
            notes: notes
        };
    },

    _days: function (fromIso, toIso) {
        var p = function (s) { var a = s.split('-'); return Date.UTC(+a[0], +a[1] - 1, +a[2]); };
        return Math.round((p(toIso) - p(fromIso)) / 86400000);
    },

    type: 'RiskScoringEngine'
};
