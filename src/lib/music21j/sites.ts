/**
 * Objects for keeping track of relationships among Music21Objects.
 *
 * Copyright (c) 2017-2021, Michael Scott Asato Cuthbert
 * License: BSD
 */

import * as common from './common';
import { Music21Exception } from './exceptions21';

/**
 */
export class SitesException extends Music21Exception {}
/**
 * SiteRef.site is held strongly in Javascript.  This is
 * actually NOT a problem because of the difference between
 * the way JS Garbage Collection works from Python (in all
 * browsers since IE6...). They follow reference chains and
 * find unreachable references and don't just check reference
 * counts.  Thus circular references still allow memory to be
 * garbage collected.  Tested in Chrome on 100000 streams, and
 * very small additional memory usage.
 *
 * https://stackoverflow.com/questions/7347203/circular-references-in-javascript-garbage-collector
 */
export class SiteRef {
	isDead: boolean = false;
	classString: string;
	globalSiteIndex: boolean | number = false;
	siteIndex: number;
}

const _NoneSiteRef = new SiteRef();
_NoneSiteRef.globalSiteIndex = -2;
_NoneSiteRef.siteIndex = -2;

const _singletonCounter = new common.SingletonCounter();

const GLOBAL_SITE_STATE_DICT = new WeakMap();

export function getId(obj: any): number | string {
	if (!GLOBAL_SITE_STATE_DICT.has(obj)) {
		const newId = _singletonCounter.call();
		GLOBAL_SITE_STATE_DICT.set(obj, newId);
	}
	return GLOBAL_SITE_STATE_DICT.get(obj);
}

export class Sites {
	siteDict;
	protected _siteIndex: number = 0;
	protected _lastID: number = -1;

	constructor() {
		this.siteDict = new Map();
		this.siteDict.set(_NoneSiteRef.siteIndex, _NoneSiteRef);
	}

	get length(): number {
		return this.siteDict.size;
	}

	/**
	 *
	 * @returns {Array<*>}
	 */
	protected _keysByTime(newFirst: boolean = true) {
		const post = [];
		for (const [key, siteRef] of this.siteDict) {
			const keyVal = [siteRef.siteIndex, key];
			post.push(keyVal);
		}
		post.sort();
		if (newFirst) {
			post.reverse();
		}
		return post.map((innerList) => innerList[1]);
	}

	add(obj, idKey = undefined, classString: string = undefined) {
		if (idKey === undefined && obj !== undefined) {
			idKey = getId(obj);
		}
		let updateNotAdd = false;
		if (this.siteDict.has(idKey)) {
			const tempSiteRef = this.siteDict.get(idKey);
			if (!tempSiteRef.isDead && tempSiteRef.site !== undefined) {
				updateNotAdd = true;
			}
		}
		if (obj !== undefined && classString === undefined) {
			classString = obj.classes[0];
		}

		let siteRef;
		if (updateNotAdd) {
			siteRef = this.siteDict.get(idKey);
			siteRef.isDead = false;
		} else {
			siteRef = new SiteRef();
		}

		siteRef.site = obj; // stores a weakRef;
		siteRef.classString = classString;
		siteRef.siteIndex = this._siteIndex;
		this._siteIndex += 1;
		siteRef.globalSiteIndex = _singletonCounter.call();

		if (!updateNotAdd) {
			this.siteDict.set(idKey, siteRef);
		}
	}

	/**
	 * @param obj
	 */
	remove(obj): boolean {
		const idKey = getId(obj);
		if (idKey === undefined) {
			return false;
		}
		return this.siteDict.delete(idKey);
	}

	clear(): void {
		this.siteDict = new Map();
		this.siteDict.set(_NoneSiteRef.siteIndex, _NoneSiteRef);
		this._lastID = -1;
	}
}
