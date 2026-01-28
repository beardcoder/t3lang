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

