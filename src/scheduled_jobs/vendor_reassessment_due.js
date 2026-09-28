/**
 * Scheduled Job: Vendor reassessments due (weekly, Monday 07:00)
 * Creates an assessment for each vendor whose next assessment date is
 * within 30 days and has none open.
 */
(function () {
    var v = new GlideRecord('core_company');
    v.addQuery('vendor', true);
    v.addQuery('u_next_assessment', '<=', gs.daysAgoEnd(-30));
    v.query();
    while (v.next()) {
        var open = new GlideRecord('sn_vdr_risk_asmt_assessment');
        open.addQuery('vendor', v.getUniqueValue());
        open.addQuery('state', 'NOT IN', 'complete,cancelled');
        open.setLimit(1);
        open.query();
        if (open.hasNext()) continue;
        gs.eventQueue('x_grc_scoring.vendor.reassessment_due', v, v.getValue('u_risk_tier'), v.getValue('u_next_assessment'));
    }
})();
