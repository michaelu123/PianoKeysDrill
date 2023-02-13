/**
 * music21j -- Javascript reimplementation of Core music21p features.
 * music21/note -- Note, Rest, NotRest, GeneralNote
 *
 * Copyright (c) 2013-21, Michael Scott Asato Cuthbert
 * Based on music21 (music21p), Copyright (c) 2006-21, Michael Scott Asato Cuthbert
 *
 * Module for note classes. See the namespace music21.note
 *
 * Namespace for notes (single pitch) or rests, and some things like Lyrics that go on notes.
 *
 * @property {string[]} stemDirectionNames - an Array of allowable stemDirection names.
 */

import * as prebase from './prebase';
import * as base from './base';
import * as pitch from './pitch';
import * as beam from './beam';

import { debug } from './debug';
import { Music21Exception } from './exceptions21';

// imports just for typechecking
import type * as articulations from './articulations';
import type * as clef from './clef';
import type * as expressions from './expressions';
import type * as instrument from './instrument';
import type * as tie from './tie';

export class NotRestException extends Music21Exception {
	// thrown in a couple of places.
}

// noinspection JSUnusedGlobalSymbols
export const noteheadTypeNames: string[] = [
	'arrow down',
	'arrow up',
	'back slashed',
	'circle dot',
	'circle-x',
	'circled',
	'cluster',
	'cross',
	'diamond',
	'do',
	'fa',
	'inverted triangle',
	'la',
	'left triangle',
	'mi',
	'none',
	'normal',
	'other',
	're',
	'rectangle',
	'slash',
	'slashed',
	'so',
	'square',
	'ti',
	'triangle',
	'x',
];

export const stemDirectionNames: string[] = [
	'double',
	'down',
	'noStem',
	'none',
	'unspecified',
	'up',
];

/**
 * Class for a single Lyric attached to a {@link GeneralNote}
 *
 * @param {string} text - the text of the lyric
 * @param {number} number=1 - the lyric number
 * @param {string} syllabic=undefined - placement of the syllable
 *     ('begin', 'middle', 'end', 'single'); undefined = interpret from text
 * @param {boolean} applyRaw=false - true = display the text exactly as it
 *     is or, false = use "-" etc. to determine syllabic
 * @param {string} identifier=undefined - identifier for the lyric.
 * @property {string} lyricConnector='-' - what to place between two
 *     lyrics that are syllabic.
 * @property {string} text - the text of the lyric syllable.
 * @property {string} syllabic - see above
 * @property {boolean} applyRaw - see above
 * @property {string} identifier - see above; gets .number if undefined
 * @property {number} number - see above
 * @property {string} rawText - text + any connectors
 */
export class Lyric extends prebase.ProtoM21Object {
	static get className() {
		return 'music21.note.Lyric';
	}

	lyricConnector: string = '-'; // override to place something else between two notes...
	text: string;
	protected _number: number;
	protected _identifier: string | number;
	syllabic: string;
	applyRaw: boolean;
	style;

	constructor(
		text: string,
		number: number = 1,
		syllabic = undefined,
		applyRaw: boolean = undefined,
		identifier: string | number = undefined
	) {
		super();
		this.text = text;
		this._number = number;
		this.syllabic = syllabic;
		this.applyRaw = applyRaw ?? false;
		this.setTextAndSyllabic(this.text, this.applyRaw);
		this._identifier = identifier;
		this.style = {
			fillStyle: 'black',
			strokeStyle: 'black',
			fontFamily: 'Serif',
			fontSize: 12,
			fontWeight: '',
		};
	}

	get identifier(): string | number {
		return this._identifier || this._number;
	}

	set identifier(i: string | number) {
		this._identifier = i;
	}

	// a property just to match m21p
	get number(): number {
		return this._number;
	}

	set number(n: number) {
		this._number = n;
	}

	// noinspection JSUnusedGlobalSymbols
	/**
	 * get rawText - gets the raw text.
	 */
	get rawText(): string {
		if (this.syllabic === 'begin') {
			return this.text + this.lyricConnector;
		} else if (this.syllabic === 'middle') {
			return this.lyricConnector + this.text + this.lyricConnector;
		} else if (this.syllabic === 'end') {
			return this.lyricConnector + this.text;
		} else {
			return this.text;
		}
	}

	set rawText(t: string) {
		this.setTextAndSyllabic(t, true);
	}

	/**
	 * setTextAndSyllabic - Given a setting for rawText and applyRaw,
	 *     sets the syllabic type for a lyric based on the rawText
	 *
	 * set applyRaw = false if hyphens should not be applied
	 */
	setTextAndSyllabic(rawText: string, applyRaw: boolean = false): this {
		if (rawText === undefined) {
			this.text = undefined;
			return this;
		}

		if (
			!applyRaw &&
			rawText.indexOf(this.lyricConnector) === 0 &&
			rawText.slice(-1) === this.lyricConnector
		) {
			this.text = rawText.slice(1, -1);
			this.syllabic = 'middle';
		} else if (!applyRaw && rawText.indexOf(this.lyricConnector) === 0) {
			this.text = rawText.slice(1);
			this.syllabic = 'end';
		} else if (!applyRaw && rawText.slice(-1) === this.lyricConnector) {
			this.text = rawText.slice(0, -1);
			this.syllabic = 'begin';
		} else {
			this.text = rawText;
			if (this.syllabic === undefined) {
				this.syllabic = 'single';
			}
		}
		return this;
	}
}

/* Notes and rests etc... */

/**
 * Superclass for all Note values
 *
 * @param {(number|undefined)} [ql=1.0] - quarterLength of the note
 * @property {boolean} [isChord=false] - is this a chord
 * @property {number} quarterLength - shortcut to `.duration.quarterLength`
 * @property {string} lyric - the text of the first
 *     {@link Lyric} object; can also set one.
 * @property {Array<Lyric>} lyrics - array of attached lyrics
 * @property {number} [volume=60] - how loud is this note, 0-127, before
 *     articulations
 * @property {number} midiVolume - how loud is this note, taking into
 *     account articulations
 */
export class GeneralNote extends base.Music21Object {
	static get className() {
		return 'music21.note.GeneralNote';
	}

	isNote: boolean = false;
	isRest: boolean = false;
	isChord: boolean = false;
	volume: number = 60;
	expressions: expressions.Expression[];
	articulations: articulations.Articulation[];
	lyrics: Lyric[];
	tie: tie.Tie;

	constructor(ql = 1.0) {
		super();
		this.expressions = [];
		this.articulations = [];
		this.lyrics = [];

		this.duration.quarterLength = ql;
		/* TODO: editorial objects, style(color), addLyric, insertLyric, hasLyrics */
		/* Later: augmentOrDiminish, getGrace, */
	}

	get lyric() {
		if (this.lyrics.length > 0) {
			return this.lyrics[0].text;
		} else {
			return undefined;
		}
	}

	set lyric(value) {
		this.lyrics = [];
		if (value !== undefined) {
			this.lyrics.push(new Lyric(value));
		}
	}

	get midiVolume() {
		let volume = this.volume;
		if (volume === undefined) {
			volume = 60;
		}
		if (this.articulations !== undefined) {
			this.articulations.forEach((a) => {
				volume *= a.dynamicScale;
				if (volume > 127) {
					volume = 127;
				} else if (Number.isNaN(volume)) {
					volume = 60;
				}
			});
		}
		volume = Math.floor(volume);
		return volume;
	}

	// noinspection JSUnusedGlobalSymbols
	/**
	 * Add a {@link Lyric} object to the Note
	 *
	 * @param {string} text - text to be added
	 * @param {number} [lyricNumber] - integer specifying lyric (defaults to the current `.lyrics.length` + 1)
	 * @param {boolean} [applyRaw=false] - if `true`, do not parse the text for clues about syllable placement.
	 * @param {string} [lyricIdentifier] - an optional identifier
	 */
	addLyric(text, lyricNumber, applyRaw = false, lyricIdentifier = undefined) {
		if (lyricNumber === undefined) {
			const maxLyrics = this.lyrics.length + 1;
			const newLyric = new Lyric(text, maxLyrics, undefined, applyRaw, lyricIdentifier);
			this.lyrics.push(newLyric);
		} else {
			let foundLyric = false;
			for (let i = 0; i < this.lyrics.length; i++) {
				const thisLyric = this.lyrics[i];
				if (thisLyric.number === lyricNumber) {
					thisLyric.text = text;
					foundLyric = true;
					break;
				}
			}
			if (foundLyric === false) {
				const newLyric = new Lyric(text, lyricNumber, undefined, applyRaw, lyricIdentifier);
				this.lyrics.push(newLyric);
			}
		}
	}

	/**
	 * Change stem direction according to clef. Does nothing for GeneralNote; overridden in subclasses.
	 */
	setStemDirectionFromClef(clef: clef.Clef): this {
		return this;
	}

	getStemDirectionFromClef(clef: clef.Clef): string {
		return '';
	}

	/**
	 * Return the active channel for the instrument or activeSite's instrument
	 */
	activeChannel(instrument?: instrument.Instrument): number {
		if (instrument === undefined && this.activeSite !== undefined) {
			instrument = this.activeSite.instrument;
		}
		let channel: number = 0;
		if (instrument !== undefined) {
			channel = instrument.midiChannel;
		}
		return channel;
	}

	/**
	 * Play the current element as a MIDI note.
	 *
	 * For a general note -- same as a rest -- doesn't make a sound.  :-)
	 *
	 * @param {number} [tempo=120] - tempo in Quarter Lengths per minute.
	 * @param {base.Music21Object} [nextElement] - for determining
	 *     the length to play in case of tied notes, etc.
	 * @param {Object} [options] - other options (currently just
	 *     `{instrument: music21.instrument.Instrument}` and channel[unused])
	 * @returns {number} - delay time in milliseconds until the next element (may be ignored)
	 */
	playMidi(
		tempo: number = 120,
		nextElement: base.Music21Object = undefined,
		{
			instrument = undefined,
			channel = undefined,
			playLegato = false,
		}: {
			instrument?: instrument.Instrument;
			channel?: number;
			playLegato?: boolean;
		} = {}
	): number {
		// returns the number of milliseconds to the next element in
		// case that can't be determined otherwise.
		const ql = this.duration.quarterLength;
		const milliseconds = (60 * ql * 1000) / tempo;
		return milliseconds;
	}
}

/**
 * Specifies that a GeneralNote is not a rest (Unpitched, Note, Chord).
 */
export class NotRest extends GeneralNote {
	static get className() {
		return 'music21.note.NotRest';
	}
	// noinspection JSUnusedGlobalSymbols
	notehead: string = 'normal';
	// noinspection JSUnusedGlobalSymbols
	noteheadFill: string = 'default'; // TODO(msc) -- move to style
	noteheadColor: string = 'black';
	noteheadParenthesis: boolean = false;
	volume: number = 64; // not a real object yet.
	beams: beam.Beams;

	// ['up','down','noStem', 'unspecified']
	// double not supported.
	protected _stemDirection: string = 'unspecified';

	constructor(ql: number = 1.0) {
		super(ql);
		this.beams = new beam.Beams();
		/* TODO: this.duration.linkage -- need durationUnits */
		/* TODO: check notehead, noteheadFill, noteheadParentheses */
	}

	get pitches(): pitch.Pitch[] {
		return [];
	}

	set pitches(_value: pitch.Pitch[]) {
		// purposely does nothing
	}

	get stemDirection() {
		return this._stemDirection;
	}

	set stemDirection(direction) {
		if (direction === undefined) {
			direction = 'unspecified';
		} else if (direction === 'none') {
			direction = 'noStem';
		} else if (!stemDirectionNames.includes(direction)) {
			throw new NotRestException(`not a valid stem direction name: ${direction}`);
		}
		this._stemDirection = direction;
	}
}

/* ------- Note ----------- */
/**
 * A very, very important class! music21.note.Note objects combine a music21.pitch.Pitch
 * object to describe pitch (highness/lowness) with a music21.duration.Duration object
 * that defines length, with additional features for drawing the Note, playing it back, etc.
 *
 * Together with {@link Stream} one of the two most important
 * classes in `music21`.
 *
 * See {@link NotRest}, {@link GeneralNote},
 * {@link base.Music21Object}
 * and {@link prebase.ProtoM21Object} (or in general, the **extends** list below) for other
 * things you can do with a `Note` object.
 *
 * Missing from music21p: `transpose(), fullName`.  Transpose cannot be added because of circular imports
 */
export class Note extends NotRest {
	static get className() {
		return 'music21.note.Note';
	}

	// noinspection JSUnusedGlobalSymbols
	isNote: boolean = true;
	isRest: boolean = false;
	pitch: pitch.Pitch;

	/**
	 *
	 * nn -- pitch name ("C", "D#", "E-") w/ or w/o octave ("C#4"), or a pitch.Pitch object
	 */
	constructor(nn: string | number | pitch.Pitch = 'C4', ql: number = 1.0) {
		super(ql);
		if (nn instanceof pitch.Pitch) {
			this.pitch = nn as pitch.Pitch;
		} else {
			this.pitch = new pitch.Pitch(nn);
		}
	}

	stringInfo(): string {
		return this.name;
	}

	get name(): string {
		return this.pitch.name;
	}

	set name(nn: string) {
		this.pitch.name = nn;
	}

	get nameWithOctave(): string {
		return this.pitch.nameWithOctave;
	}

	set nameWithOctave(nn: string) {
		this.pitch.nameWithOctave = nn;
	}

	get step(): string {
		return this.pitch.step;
	}

	set step(nn: string) {
		this.pitch.step = nn;
	}

	get octave(): number {
		return this.pitch.octave;
	}

	set octave(nn: number) {
		this.pitch.octave = nn;
	}

	get pitches(): pitch.Pitch[] {
		return [this.pitch];
	}

	set pitches(value: pitch.Pitch[]) {
		if (!value.length) {
			throw new Error('Pitches must be an Array of one (or more) pitches');
		}
		this.pitch = value[0];
	}

	/* TODO: transpose, fullName */

	/**
	 * Change stem direction according to clef.
	 *
	 * clef to set the stem direction of.
	 * returns original object, for chaining methods
	 */
	setStemDirectionFromClef(clef: clef.Clef): this {
		if (clef !== undefined) {
			this.stemDirection = this.getStemDirectionFromClef(clef);
		}
		return this;
	}

	/**
	 * Same as setStemDirectionFromClef, but do not set the note, just return it.
	 */
	getStemDirectionFromClef(clef: clef.Clef): string {
		const midLine = clef.lowestLine + 4;
		const dnnFromCenter = this.pitch.diatonicNoteNum - midLine;
		// console.log(dnnFromCenter, this.pitch.nameWithOctave);
		if (dnnFromCenter >= 0) {
			return 'down';
		} else {
			return 'up';
		}
	}
}

/* ------ TODO: Unpitched ------ */

/* ------ Rest ------ */

/**
 * Represents a musical rest.
 *
 * @param {number} [ql=1.0] - length in number of quarterNotes
 * @property {Boolean} [isNote=false]
 * @property {Boolean} [isRest=true]
 * @property {string} [name='rest']
 * @property {number} [stepShift=0] - number of steps/lines to shift up or down from default
 * @property {string|undefined} [color='black'] - color of the rest
 */
export class Rest extends GeneralNote {
	static get className() {
		return 'music21.note.Rest';
	}

	// noinspection JSUnusedGlobalSymbols
	isNote: boolean = false;
	isRest: boolean = true;
	name: string = 'rest';
	stepShift: number = 0;
	color: string = 'black';
	volume: number = 0;

	// this dummy constructor is here for JetBrains typescript linter
	// which otherwise complains that Rests have no durations, etc.
	constructor(ql = 1.0) {
		super(ql);
		this.name = 'rest';
	}

	/**
	 *
	 * @returns {string}
	 */
	stringInfo() {
		return this.duration.quarterLength.toString();
	}
}
