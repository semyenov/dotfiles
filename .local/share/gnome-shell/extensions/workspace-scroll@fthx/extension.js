/*
    Workspace Scroll for GNOME Shell 45+
    (c) Francois Thirioux 2023
    Contributors: @fthx
    License GPL v3
*/


import Clutter from 'gi://Clutter';
import Meta from 'gi://Meta';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';


export default class WorkspaceScrollExtension {
    _on_taskbar_scroll(origin, event) {
        this._active_workspace = global.workspace_manager.get_active_workspace();
        switch(event.get_scroll_direction()) {
            case Clutter.ScrollDirection.DOWN:
            case Clutter.ScrollDirection.RIGHT:
                this._active_workspace.get_neighbor(Meta.MotionDirection.RIGHT).activate(event.get_time());
                break;
            case Clutter.ScrollDirection.UP:
            case Clutter.ScrollDirection.LEFT:
                this._active_workspace.get_neighbor(Meta.MotionDirection.LEFT).activate(event.get_time());
                break;
        }
    }

    enable() {
        this._on_activities_scroll = Main.panel.statusArea['activities'].connect('scroll-event', this._on_taskbar_scroll.bind(this));
    }

    disable() {
        if (this._on_activities_scroll) {
            Main.panel.statusArea['activities'].disconnect(this._on_activities_scroll);
            this._on_activities_scroll = null;
        }
    }
}
