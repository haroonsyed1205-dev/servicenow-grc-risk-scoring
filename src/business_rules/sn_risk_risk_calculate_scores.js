/**
 * Business Rule: Calculate inherent and residual risk
 * Table: sn_risk_risk   When: before   Insert/Update: true
 * Condition: current.u_likelihood.changes() || current.u_impact.changes()
 * (Control changes trigger a recalculation via sn_risk_m2m_risk_control rule.)
 */
(function executeRule(current, previous) {
    var controls = [];
    var m2m = new GlideRecord('sn_risk_m2m_risk_control');
    m2m.addQuery('sn_risk_risk', current.getUniqueValue());
    m2m.query();
    while (m2m.next()) {
        var ctl = m2m.sn_compliance_control.getRefRecord();
        controls.push({
            id: ctl.getValue('number'),
            effectiveness: ctl.getValue('u_design_effectiveness') || 'not_tested',
            lastTested: ctl.getValue('u_last_tested') || ''
        });
    }

    var engine = new RiskScoringEngine({
        appetite: JSON.parse(gs.getProperty('x_grc_scoring.appetite', '{"default":12}'))
    });
    var r = engine.score({
        likelihood: parseInt(current.getValue('u_likelihood'), 10),
        impact: parseInt(current.getValue('u_impact'), 10),
        category: current.getValue('category')
    }, controls, new GlideDate().getValue());

    if (!r.valid) {
        gs.addErrorMessage(r.errors.join('; '));
        current.setAbortAction(true);
        return;
    }
    current.setValue('u_inherent_score', r.inherent);
    current.setValue('u_inherent_rating', r.inherentRating);
    current.setValue('u_residual_score', r.residual);
    current.setValue('u_residual_rating', r.residualRating);
    current.setValue('u_appetite_breach', r.appetiteBreach);
    if (r.notes.length) current.work_notes = r.notes.join('\n');
    if (r.appetiteBreach && (!previous || previous.getValue('u_appetite_breach') != 'true')) {
        gs.eventQueue('x_grc_scoring.risk.appetite_breach', current, String(r.residual), String(r.appetiteLimit));
    }
})(current, previous);
