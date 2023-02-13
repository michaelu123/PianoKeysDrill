/**
 * music21j -- Javascript reimplementation of Core music21p features.
 * music21/base -- objects in base in music21p routines
 *
 * does not load the other modules.
 *
 * Copyright (c) 2013-21, Michael Scott Asato Cuthbert
 * Based on music21 (=music21p), Copyright (c) 2006-21, Michael Scott Asato Cuthbert
 *
 * module for Music21Objects
 */
import * as common from './common';
import * as derivation from './derivation';
import * as duration from './duration';
import * as editorial from './editorial';
import * as prebase from './prebase';
import * as sites from './sites';
import * as style from './style';

// imports for typing only
import { Music21Exception } from './exceptions21';

declare interface StreamRecursionLike {
	recursionType: string;
}

/**
 * Base class for any object that can be placed in a {@link Stream}.
 *
 * @property {Stream} [activeSite] - hardlink to a
 *     {@link Stream} containing the element.
 * @property {number} classSortOrder - Default sort order for this class
 *     (default 20; override in other classes). Lower numbered objects will sort
 *     before other objects in the staff if priority and offset are the same.
 * @property {string[]} groups - An Array of strings representing group
 *     (equivalent to css classes) to assign to the object. (default [])
 * @property {boolean} isMusic21Object - true
 * @property {boolean} isStream - false
 * @property {number} offset - offset from the beginning of the stream (in quarterLength)
 * @property {number} priority - The priority (lower = earlier or more left) for
 *     elements at the same offset. (default 0)
 */
export class Music21Object extends prebase.ProtoM21Object {
	static get className() {
		return 'music21.base.Music21Object';
	}

	classSortOrder: number = 20; // default;
	protected _activeSite: any;
	protected _activeSiteStoredOffset: number = 0;
	protected _naiveOffset: number = 0;
	// _derivation = undefined;
	protected _style: style.Style;
	protected _editorial: Record<string, any>; // actually editorial.Editorial
	protected _duration: duration.Duration;
	protected _derivation: derivation.Derivation;
	protected _priority: number = 0;
	id: number | string = 0;
	groups: string[] = []; // custom object in m21p
	sites: sites.Sites;
	isMusic21Object: boolean = true;
	isStream: boolean = false;
	// beat, etc.
	// lots to do...

	protected static _styleClass: typeof style.Style = style.Style;

	constructor(keywords = {}) {
		super();
		this._duration = new duration.Duration(0.0);
		this.id = sites.getId(this);
		this.sites = new sites.Sites();
		this._cloneCallbacks._activeSite = false;
		this._cloneCallbacks._activeSiteStoredOffset = false;
		this._cloneCallbacks._derivation = function Music21Music21Object_cloneCallbacks_derivation(
			keyName,
			newObj,
			self,
			deep,
			memo
		) {
			const newDerivation = new derivation.Derivation(newObj);
			newDerivation.origin = self;
			newDerivation.method = 'clone';
			newObj[keyName] = newDerivation;
		};

		// noinspection JSUnusedLocalSymbols
		this._cloneCallbacks.sites = function Music21Object_cloneCallbacks_sites(
			keyName,
			newObj,
			self,
			deep,
			memo
		) {
			newObj.sites = new sites.Sites();
		};
	}

	/**
	 * Override clone on prebase to add a derivation.
	 */
	clone(deep: boolean = true, memo = undefined): this {
		const ret: this = super.clone(deep, memo);
		const newDerivation = new derivation.Derivation(ret);
		newDerivation.origin = this;
		newDerivation.method = 'clone'; // '__deepcopy__' in m21p
		ret.derivation = newDerivation;
		return ret;
	}

	stringInfo(): string {
		let id16 = this.id;
		if (typeof id16 === 'number') {
			const idNumber = <number>id16;
			id16 = <string>idNumber.toString(16);
			while (id16.length < 4) {
				id16 = '0' + id16;
			}
			id16 = '0x' + id16;
		}
		return id16;
	}

	get activeSite() {
		return this._activeSite;
	}

	set activeSite(site) {
		if (site === undefined) {
			this._activeSite = undefined;
			this._activeSiteStoredOffset = undefined;
		} else {
			let offset: number;
			try {
				offset = site.elementOffset(this);
			} catch (e) {
				throw new sites.SitesException('activeSite cannot be set for an object not in the stream');
			}
			this._activeSite = site;
			this._activeSiteStoredOffset = offset;
		}
	}

	get derivation(): derivation.Derivation {
		if (this._derivation === undefined) {
			this._derivation = new derivation.Derivation(this);
		}
		return this._derivation;
	}

	set derivation(newDerivation: derivation.Derivation) {
		this._derivation = newDerivation;
	}

	/**
	 * Note that the editorial is typed as Record<string, any>
	 *     but actually returns an editorial object
	 */
	get editorial(): Record<string, any> {
		if (this._editorial === undefined) {
			this._editorial = new editorial.Editorial();
		}
		return this._editorial;
	}

	set editorial(newEditorial: editorial.Editorial | Record<string, any>) {
		this._editorial = newEditorial as any;
	}

	get hasEditorialInformation(): boolean {
		return this._editorial !== undefined;
	}

	/**
	 * Returns true if there is a style.Style object
	 * already associated with this object, false otherwise.
	 *
	 * Calling .style on an object will always create a new
	 * Style object, so even though a new Style object isn't too expensive
	 * to create, this property helps to prevent creating new Styles more than
	 * necessary.
	 */
	get hasStyleInformation(): boolean {
		return this._style !== undefined;
	}

	/**
	 * Returns (or Creates and then Returns) the Style object
	 * associated with this object, or sets a new
	 * style object.  Different classes might use
	 * different Style objects because they might have different
	 * style needs (such as text formatting or bezier positioning)
	 *
	 * Eventually will also query the groups to see if they have
	 * any styles associated with them.
	 */
	get style(): style.Style {
		if (!this.hasStyleInformation) {
			const StyleClass = <typeof style.Style>this.constructor;
			this._style = new StyleClass();
		}
		return this._style;
	}

	set style(newStyle: style.Style) {
		this._style = newStyle;
	}

	get offset(): number {
		if (this.activeSite === undefined) {
			return this._naiveOffset;
		} else {
			return this.activeSite.elementOffset(this);
		}
	}

	set offset(newOffset: number) {
		newOffset = common.opFrac(newOffset);
		if (this.activeSite === undefined) {
			this._naiveOffset = newOffset;
		} else {
			this.activeSite.setElementOffset(this, newOffset);
		}
	}

	get priority(): number {
		return this._priority;
	}

	set priority(p: number) {
		this._priority = p;
	}

	get duration(): duration.Duration {
		return this._duration;
	}

	set duration(newDuration: duration.Duration) {
		if (typeof newDuration === 'object') {
			this._duration = newDuration;
			// common errors below...
		} else if (typeof newDuration === 'number') {
			this._duration.quarterLength = newDuration;
		} else if (typeof newDuration === 'string') {
			this._duration.type = newDuration;
		}
	}

	get quarterLength(): number {
		return this.duration.quarterLength;
	}

	set quarterLength(ql: number) {
		this.duration.quarterLength = ql;
	}

	mergeAttributes(other) {
		// id;
		this.groups = other.groups.slice();
		return this;
	}

	// ---------- Contexts -------------

	getContextByClass(className, options = {}) {
		const params = {
			getElementMethod: 'getElementAtOrBefore',
			sortByCreationTime: false,
		};
		common.merge(params, options);

		const getElementMethod = params.getElementMethod;
		const sortByCreationTime = params.sortByCreationTime;

		if (className !== undefined && !(className instanceof Array)) {
			className = [className];
		}
		if (getElementMethod.includes('At') && this.isClassOrSubclass(className)) {
			return this;
		}

		return undefined;
	}
}

// TODO(msc) -- ElementWrapper
