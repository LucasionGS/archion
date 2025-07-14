import { Variable, exec, execAsync } from "astal";
import { App } from "astal/gtk4";

export namespace IonTheme {
    function jpv(json: string) {
        return json.replace(/^'/g, "").replace(/'$/g, "");
    }

    export namespace DefaultColors {
        export const background = "#1b1e2f";
        export const foreground = "#f1f1f1";
        export const accent = "#4e27b1";
        export const secondary = "#c46e12";
    }

    export const currentTheme = Variable(getThemePreference() || "dark");
    export function getThemePreference(): ValidThemeName {
        return jpv(exec("gsettings get org.gnome.desktop.interface gtk-color-scheme")) as any;
    }

    export function setThemePreference(theme: ValidThemeName): void {
        currentTheme.set(theme);
        execAsync(`gsettings set org.gnome.desktop.interface gtk-color-scheme '${theme}'`);
    }

    export const themes = [
        { id: "dark", name: "Dark", preview: "#2b2b2b" },
        { id: "light", name: "Light", preview: "#ffffff" },
        { id: "auto", name: "Auto", preview: "linear-gradient(45deg, #2b2b2b 50%, #ffffff 50%)" }
    ] as const;

    export type ValidThemeName = (typeof themes)[number]["id"];

    export const accentColors = [
        // DefaultColors.accent,
        //            "#dc3545", "#28a745", "#007bff",
        // "#6f42c1", "#fd7e14", "#20c997", "#6c757d"
        "blue",
        "teal",
        "green",
        "yellow",
        "orange",
        "red",
        "pink",
        "purple"
    ] as const;

    const accentColorNamesToHexOpacity = {
        blue: (o: number) => `rgba(66, 133, 244, ${o})`,
        teal: (o: number) => `rgba(52, 168, 83, ${o})`,
        green: (o: number) => `rgba(15, 157, 88, ${o})`,
        yellow: (o: number) => `rgba(255, 193, 7, ${o})`,
        orange: (o: number) => `rgba(255, 159, 64, ${o})`,
        red: (o: number) => `rgba(219, 68, 55, ${o})`,
        pink: (o: number) => `rgba(244, 67, 54, ${o})`,
        purple: (o: number) => `rgba(156, 39, 176, ${o})`
    }
    
    export const accentColor = Variable(getAccent() || "#4e27b1");
    export function getAccent(): ValidAccentColor {
        const color = jpv(exec("gsettings get org.gnome.desktop.interface accent-color")) as any;
        applyAccentColor(color);
        return color;
    }

    export function setAccent(color: ValidAccentColor): void {
        if (accentColor.get() !== color) {
            accentColor.set(color);
            execAsync(`gsettings set org.gnome.desktop.interface accent-color '${color}'`);
        }
        applyAccentColor(color);
    }

    function applyAccentColor(color: ValidAccentColor = accentColor.get()): void {
        setTimeout(() => {
            App.apply_css(`
                .settings-sidebar .sidebar-category.active {
                    background-color: ${accentColorNamesToHexOpacity[color](0.2)};
                    border-color: ${color};
                }
                    
                .settings-sidebar .sidebar-category.active icon,
                .settings-sidebar .sidebar-category.active label {
                    color: ${color};
                }
            `);
        }, 0); // little delay to ensure CSS is applied after other stuff
    }

    export type ValidAccentColor = (typeof accentColors)[number];

    export const iconTheme = Variable("Adwaita");
    export const cursorTheme = Variable("default");

    export const systemFont = Variable(getSystemFont() || "Inter");

    export function getSystemFont(withSize = false): string {
        let font = jpv(exec("gsettings get org.gnome.desktop.interface font-name"));
        if (withSize) {
            return font;
        }
        return font.replace(/\d+$/, "").trim();
    }
    
    export function setSystemFont(font: string): void {
        systemFont.set(font)
        execAsync(`gsettings set org.gnome.desktop.interface font-name '${font} ${fontSize.get()}'`)
    }
    
    export const monoFont = Variable(getMonoFont() || "JetBrains Mono");

    export function getMonoFont(withSize = false): string {
        let font = jpv(exec("gsettings get org.gnome.desktop.interface monospace-font-name"));
        if (withSize) {
            return font;
        }
        return font.replace(/\d+$/, "").trim();
    }
    
    export function setMonoFont(font: string): void {
        monoFont.set(font)
        execAsync(`gsettings set org.gnome.desktop.interface monospace-font-name '${font} ${fontSize.get()}'`)
    }
    
    export const fontSize = Variable(getFontSize() || 11);

    export function getFontSize(): number {
        return parseInt(getSystemFont(true).match(/\d+$/)?.pop() || "11", 10);
    }
    
    export function setFontSize(size: number): void {
        fontSize.set(size);
        setSystemFont(systemFont.get());
        setMonoFont(monoFont.get());
    }

    export function getFonts() {
        const fonts = [...new Set(exec("fc-list --format '%{family},'").trim().split(",").filter(Boolean))];
        const standardFonts = fonts.filter(font => !font.includes("Mono"));
        const monoFonts = fonts.filter(font => font.includes("Mono"));
        return {
            standard: standardFonts,
            monospace: monoFonts
        };
    }
}
