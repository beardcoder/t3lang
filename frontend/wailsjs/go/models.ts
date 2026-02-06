export namespace main {
	
	export class FileEntry {
	    name: string;
	    path: string;
	    isDirectory: boolean;
	
	    static createFrom(source: any = {}) {
	        return new FileEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.isDirectory = source["isDirectory"];
	    }
	}
	export class FileInfo {
	    isFile: boolean;
	    isDirectory: boolean;
	
	    static createFrom(source: any = {}) {
	        return new FileInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.isFile = source["isFile"];
	        this.isDirectory = source["isDirectory"];
	    }
	}

}

export namespace services {
	
	export class T3FileMetadata {
	    path: string;
	    name: string;
	    language: string;
	    baseName: string;
	    directory: string;
	
	    static createFrom(source: any = {}) {
	        return new T3FileMetadata(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.name = source["name"];
	        this.language = source["language"];
	        this.baseName = source["baseName"];
	        this.directory = source["directory"];
	    }
	}
	export class TranslationGroup {
	    id: string;
	    baseName: string;
	    directory: string;
	    files: Record<string, T3FileMetadata>;
	    sourceFile?: T3FileMetadata;
	
	    static createFrom(source: any = {}) {
	        return new TranslationGroup(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.baseName = source["baseName"];
	        this.directory = source["directory"];
	        this.files = this.convertValues(source["files"], T3FileMetadata, true);
	        this.sourceFile = this.convertValues(source["sourceFile"], T3FileMetadata);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class WorkspaceScan {
	    rootPath: string;
	    groups: TranslationGroup[];
	    totalFiles: number;
	
	    static createFrom(source: any = {}) {
	        return new WorkspaceScan(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.rootPath = source["rootPath"];
	        this.groups = this.convertValues(source["groups"], TranslationGroup);
	        this.totalFiles = source["totalFiles"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

