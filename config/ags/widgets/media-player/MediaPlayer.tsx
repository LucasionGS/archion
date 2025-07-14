import { Astal, Gtk } from "astal/gtk4"
import Mpris from "gi://AstalMpris"
import { bind, Variable } from "astal"

function lengthStr(length: number) {
    const min = Math.floor(length / 60)
    const sec = Math.floor(length % 60)
    const sec0 = sec < 10 ? "0" : ""
    return `${min}:${sec0}${sec}`
}


function MediaPlayer({ player }: { player: Mpris.Player }) {
    const { START, END } = Gtk.Align

    const title = bind(player, "title").as(t =>
        t || "Unknown Track")

    const artist = bind(player, "artist").as(a =>
        a || "Unknown Artist")

    const coverArt = bind(player, "coverArt").as(c =>
        `background-image: url('${c}')`)

    // const playerIcon = bind(player, "entry").as(e =>
    //     Astal.Icon.lookup_icon(e) ? e : "audio-x-generic-symbolic")
    const playerIcon = bind(player, "entry").as(e => "audio-x-generic-symbolic")

    const position = bind(player, "position").as(p => player.length > 0
        ? p / player.length : 0)

    const playIcon = bind(player, "playbackStatus").as(s =>
        s === Mpris.PlaybackStatus.PLAYING
            ? "media-playback-pause-symbolic"
            : "media-playback-start-symbolic"
    )

    return <box cssName="MediaPlayer">
        <box cssName="cover-art" />
        <box vertical>
            <box cssName="title">
                <label hexpand halign={START} label={title} />
                <image iconName={playerIcon} />
            </box>
            <label halign={START} valign={START} vexpand wrap label={artist} />
            <slider
                visible={bind(player, "length").as(l => l > 0)}
                onDragged={({ value }) => player.position = value * player.length}
                value={position}
            />
            <centerbox 
                cssName="actions"
                startWidget={
                    <label
                        hexpand
                        cssName="position"
                        halign={START}
                        visible={bind(player, "length").as(l => l > 0)}
                        label={bind(player, "position").as(lengthStr)}
                    />
                }
                centerWidget={
                    <box>
                        <button
                            onClicked={() => player.previous()}
                            visible={bind(player, "canGoPrevious")}
                            child={<image iconName="media-skip-backward-symbolic" />}
                        />
                        <button
                            onClicked={() => player.play_pause()}
                            visible={bind(player, "canControl")}
                            child={<image iconName={playIcon} />}
                        />
                        <button
                            onClicked={() => player.next()}
                            visible={bind(player, "canGoNext")}
                            child={<image iconName="media-skip-forward-symbolic" />}
                        />
                    </box>
                }
                endWidget={
                    <label
                        cssName="length"
                        hexpand
                        halign={END}
                        visible={bind(player, "length").as(l => l > 0)}
                        label={bind(player, "length").as(l => l > 0 ? lengthStr(l) : "0:00")}
                    />
                }
            />
        </box>
    </box>
}

export default function MprisPlayers(show: Variable<boolean>) {
    const mpris = Mpris.get_default();
    
    return (
        <box visible={show()} vertical>
            {bind(mpris, "players").as(arr => arr.map(player => (
                <MediaPlayer player={player} />
            )))}
        </box>
    );
}
