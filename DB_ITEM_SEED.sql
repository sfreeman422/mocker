USE mockerdbdev;

INSERT INTO item(name, description, pricePct, isStackable, isRange, max_active_ms, min_active_ms, isTimeModifier, max_modified_ms, min_modified_ms, isDefensive, isEffect, requiresUser) VALUES("50 Cal Rounds", "Adds an additional two minutes to your randomly generated muzzle time for one hour.", 0.1, true, false, 3600000, 3600000, true, 120000, 120000, false, true, false);
INSERT INTO item(name, description, pricePct, isStackable, isRange, max_active_ms, min_active_ms, isTimeModifier, max_modified_ms, min_modified_ms, isDefensive, isEffect, requiresUser) VALUES("Guardian Angel", "Prevents the user you specify from being muzzled for a random time between 10 minutes and 30 minutes.", 0.20, false, true, 1800000, 600000, false, 0, 0, true, true, true);
INSERT INTO item(name, description, pricePct, isStackable, isRange, max_active_ms, min_active_ms, isTimeModifier, max_modified_ms, min_modified_ms, isDefensive, isEffect, requiresUser) VALUES("Resurrection", "Removes a muzzle from the currently muzzled user you specify.", 0.2, false, false, 0, 0, false, 0, 0, false, false, true);