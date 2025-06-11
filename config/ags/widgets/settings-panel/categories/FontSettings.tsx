import { Astal, Gtk } from "astal/gtk3"
import { bind, Variable, execAsync, Binding } from "astal"
import { IonTheme } from "../../../IonTheme"

export default function FontSettings() {
    const allFonts = IonTheme.getFonts();
    const fonts = allFonts.standard;
    const monoFonts = allFonts.monospace;

    return (
        <box className="settings-category" vertical>
            <box className="setting-group" vertical>
                <label className="group-title" label="System Fonts" />
                
                <box className="setting-item">
                    <label label="Interface Font" />
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        {[
                            <DropdownSelect
                                value={IonTheme.systemFont}
                                onChange={newFont => {
                                    IonTheme.setSystemFont(newFont);
                                }}
                                options={fonts}
                                determineFont={value => value}
                            />
                        ]}
                    </box>
                </box>

                <box className="setting-item">
                    <label label="Monospace Font" />
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        {[
                            <DropdownSelect
                                value={IonTheme.monoFont}
                                onChange={newFont => {
                                    IonTheme.setMonoFont(newFont);
                                }}
                                options={monoFonts}
                                determineFont={value => value}
                            />
                        ]}
                    </box>
                </box>

                <box className="setting-item">
                    <label label="Font Size" />
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        <slider
                            value={bind(IonTheme.fontSize).as(size => (size - 8) / 8)} // Map 8-16 to 0-1
                            onDragged={({ value }) => {
                                const newSize = Math.round(8 + (value * 8));
                                IonTheme.setFontSize(newSize);
                            }}
                            widthRequest={150}
                        />
                        <label label={bind(IonTheme.fontSize).as(size => `${size}pt`)} />
                    </box>
                </box>
            </box>

            <box className="setting-group" vertical>
                <label className="group-title" label="Text Rendering" />
                
                <box className="setting-item">
                    <box vertical>
                        <label label="Font Smoothing" />
                        <label className="setting-description" label="Enable anti-aliasing" />
                    </box>
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        {[
                            <switch />
                        ]}
                    </box>
                </box>

                <box className="setting-item">
                    <box vertical>
                        <label label="Subpixel Rendering" />
                        <label className="setting-description" label="Improve text clarity on LCD displays" />
                    </box>
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        {[
                            <switch />
                        ]}
                    </box>
                </box>
            </box>
        </box>
    )
}

function DropdownSelect({ options, value, onChange, determineFont }: {
    options: string[];
    value: Variable<string>;
    onChange: (newValue: string) => void;
    determineFont?: (value: string) => string | undefined | void;
}) {
    const open = Variable(false);
    if (!options.includes(value.get())) {
        console.warn(`Value "${value.get()}" not found in options`, options);
        value.set(options[0]); // Fallback to first option
    }
    if (options.length === 0) {
        console.warn("No options provided for DropdownSelect");
        return <label label="No options available" />;
    }
    if (options.length === 1) {
        return <label label={value()} />;
    }
    return <box child={
        open().as(opened => !opened ?
            (
                <button
                    className="dropdown-button"
                    onClicked={() => {
                        open.set(!open.get());
                    }}
                    label={value()}
                />
            ) : (
                <scrollable
                    className="dropdown-menu"
                    vexpand
                    child={
                        <box vertical>
                            {options.map(option => (
                                <button
                                    className="dropdown-item dropdown-button"
                                    onClicked={() => {
                                        onChange(option);
                                        open.set(false);
                                    }}
                                    child={<label label={option} css={`
                                        font-family: ${determineFont ? determineFont(option) ?? "inherit" : "inherit"};
                                    `} />}
                                />
                            ))}
                        </box>
                    }
                />
            )
        )
    }/>
}