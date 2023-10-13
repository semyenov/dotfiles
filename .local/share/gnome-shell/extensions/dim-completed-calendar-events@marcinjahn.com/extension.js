import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import St from 'gi://St';

const SettingsPath = "org.gnome.shell.extensions.dim-completed-calendar-events";
const StylePastDaysSetting = "style-past-days";
const StyleOngoingEventsSetting = "style-ongoing-events";

class SettingsManager {
    constructor(settings) {
        this.settings = settings;
    }

    getShouldStylePastDays() {
        return this.settings.get_boolean(StylePastDaysSetting);
    }

    getShouldStyleOngoingEvents() {
        return this.settings.get_boolean(StyleOngoingEventsSetting);
    }

    setShouldStylePastDays(value) {
        this.settings.set_boolean(StylePastDaysSetting, value);
    }

    setShouldStyleOngoingEvents(value) {
        this.settings.set_boolean(StyleOngoingEventsSetting, value);
    }

    connectToChanges(func) {
        return this.settings.connect("changed", func);
    }

    disconnect(subscriptionId) {
        this.settings.disconnect(subscriptionId);
    }
}

// @ts-nocheck
function buildPatchedReloadEventsFunction(patchConfiguration) {
    return function newReloadEvents() {
        if (this._eventSource.isLoading || this._reloading)
            return;
        this._reloading = true;
        [...this._eventsList].forEach((c) => c.destroy());
        const events = this._eventSource.getEvents(this._startDate, this._endDate);
        for (let event of events) {
            const box = new St.BoxLayout({
                style_class: "event-box",
                vertical: true,
            });
            // MODIFICATIONS
            const summaryLabel = new St.Label({
                text: event.summary,
                style_class: "event-summary",
                style: isCompletedEvent(event, patchConfiguration.shouldStylePastEvents)
                    ? getCompletedEventStyle()
                    : isOngoingEvent(event, patchConfiguration.shouldStyleOngoingEvents)
                        ? getOngoingEventStyle()
                        : null,
            });
            box.add(summaryLabel);
            // END MODIFICATIONS
            box.add(new St.Label({
                text: this._formatEventTime(event),
                style_class: "event-time",
            }));
            this._eventsList.add_child(box);
        }
        if (this._eventsList.get_n_children() === 0) {
            const placeholder = new St.Label({
                text: _("No Events"),
                style_class: "event-placeholder",
            });
            this._eventsList.add_child(placeholder);
        }
        this._reloading = false;
        this._sync();
    };
}

function isCompletedEvent(event, shouldStylePastDays) {
    const isFinished = event.end < new Date();
    if (shouldStylePastDays) {
        return isFinished;
    }
    const startedInSomePastDay = new Date(event.date.getTime()).setHours(0, 0, 0, 0) <
        new Date().setHours(0, 0, 0, 0);

    return isFinished && !startedInSomePastDay;
}

function isOngoingEvent(event, shouldStyleOngoingEvents) {
    const now = new Date();

    return shouldStyleOngoingEvents && event.date <= now && now <= event.end;
}

function getCompletedEventStyle() {
    return "color: #9a9996"; // same grey as event time
}

function getOngoingEventStyle() {
    return "color: #78aeed;"; // Gnome Accent Color
}

class EventsListPatcher {
    constructor() {
        this.originalFunction = this.getEventsItem()._reloadEvents;
    }

    applyPatch(patchConfiguration) {
        const eventsItem = this.getEventsItem();
        eventsItem._reloadEvents =
            buildPatchedReloadEventsFunction(patchConfiguration).bind(eventsItem);
    }

    reversePatch() {
        const eventsItem = this.getEventsItem();
        eventsItem._reloadEvents = this.originalFunction;
    }

    getOriginalFunction() {
        const eventsItem = this.getEventsItem();

        return eventsItem._reloadEvents;
    }

    getEventsItem() {
        const dateMenu = Main.panel.statusArea.dateMenu;

        return dateMenu._eventsItem;
    }
}

function getPatchConfiguration(settings) {
    return {
        shouldStylePastEvents: settings.getShouldStylePastDays(),
        shouldStyleOngoingEvents: settings.getShouldStyleOngoingEvents(),
    };
}

class DimCompletedCalendarEventsExtension extends Extension {
    constructor() {
        super(...arguments);
        this._patcher = null;
        this._settings = null;
        this._settingsSubscription = null;
    }

    enable() {
        console.log(`Enabling extension ${this.uuid}`);
        this._settings = new SettingsManager(this.getSettings(SettingsPath));
        this._patcher = new EventsListPatcher();
        this._patcher.applyPatch(getPatchConfiguration(this._settings));
        this._settingsSubscription = this._settings.connectToChanges(() => {
            this._patcher?.applyPatch(getPatchConfiguration(this._settings));
        });
    }

    disable() {
        console.log(`Disabling extension ${this.uuid}`);
        this._patcher?.reversePatch();
        this._patcher = null;
        if (this._settingsSubscription) {
            this._settings?.disconnect(this._settingsSubscription);
            this._settingsSubscription = null;
        }
        this._settings = null;
    }
}

export { DimCompletedCalendarEventsExtension as default };
