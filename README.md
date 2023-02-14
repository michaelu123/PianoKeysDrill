This program is used for learning piano/keyboard keys. It owes to https://github.com/MelvilQ/noten lernen .
It shows either a single note or a three note chord, then you must play these notes. If successful, new notes are shown.
The code requires a Midi Connection to a real device.

The code is written with SvelteKit, Svelte Skeleton, TailwindCSS, using WebMidi and abcjs.
The start page is used for configuration:

    Sound on: the new notes are sent to the keyboard
    Attack: Loudness of the notes
    Accidentals: the note or the base note of the chord may have accidentals (i.e. may be a black key)
    Low Note: the lowest note that is played
    High Note: the highest note that is played
    Chords:
        None: only single notes are played
        Major: only major chords with three notes are played
        Minor: only minor chords with three notes are played
        Mixed: major and minor chords are played

If Chords is not None, then there is the option

    Inversions: chords may be inverted

To debug on localhost only: npm run dev

To run with https: run the script makeCert.sh, on Windows e.g. in the WSL, then build with

    npm run build

and run the server with

    node server.js

Do not call node build, this server does not support HTTPS.
Without HTTPS, calls of crypto.randomUUID() and navigator.requestMIDIAccess will not work!
