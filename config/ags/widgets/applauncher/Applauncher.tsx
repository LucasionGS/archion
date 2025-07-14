import Apps from "gi://AstalApps"
import { App, Astal, Gdk, Gtk } from "astal/gtk4"
import { Variable } from "astal"

const MAX_ITEMS = 8

function hide() {
    App.get_window("launcher")!.hide()
}

function AppButton({ app }: { app: Apps.Application }) {
    return <button
        cssName="AppButton"
        onClicked={() => { hide(); app.launch() }}
        child={
            <box>
                <image iconName={app.iconName} />
                <box valign={Gtk.Align.CENTER} vertical>
                    <label
                        cssName="name"
                        xalign={0}
                        label={app.name}
                    />
                    {app.description ? <label
                        cssName="description"
                        wrap
                        xalign={0}
                        label={app.description}
                    /> : <label label="" />}
                </box>
            </box>
        }
    />
}

export default function Applauncher() {
    const { CENTER } = Gtk.Align
    const apps = new Apps.Apps()
    const width = Variable(1000)

    const text = Variable("")
    const list = text(text => apps.fuzzy_query(text).slice(0, MAX_ITEMS))
    const onEnter = () => {
        apps.fuzzy_query(text.get())?.[0].launch()
        hide()
    }

    return <window
        name="launcher"
        anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.BOTTOM}
        exclusivity={Astal.Exclusivity.IGNORE}
        keymode={Astal.Keymode.ON_DEMAND}
        application={App}
        onShow={(self) => {
            text.set("")
            // width.set(self.get_current_monitor().workarea.width)
            width.set(1000) // fallback width
        }}
        onKeyPressed={(self, keyval, keycode, state) => {
            if (keyval === Gdk.KEY_Escape)
                self.hide()
        }}
        child={
            <box>
                <button widthRequest={width(w => w / 2)} hexpand onClicked={hide} />
                <box hexpand={false} vertical>
                    <button heightRequest={100} onClicked={hide} />
                    <box widthRequest={500} cssName="Applauncher" vertical>
                        <entry
                            placeholderText="Search"
                            text={text()}
                            onChanged={self => text.set(self.text)}
                            onActivate={onEnter}
                        />
                        <box spacing={6} vertical>
                            {list.as(list => list.map(app => (
                                <AppButton app={app} />
                            )))}
                        </box>
                        <box
                            halign={CENTER}
                            cssName="not-found"
                            vertical
                            visible={list.as(l => l.length === 0)}>
                            <image iconName="system-search-symbolic" />
                            <label label="No match found" />
                        </box>
                    </box>
                    <button hexpand onClicked={hide} />
                </box>
                <button widthRequest={width(w => w / 2)} hexpand onClicked={hide} />
            </box>
        }
    />
}
