// This source code is in the public domain.

(function() {
    function Zip() {
        this.members = [];
    }
    Zip.prototype = {
        mimeType: 'application/zip',
        addMember: function(member) {
            this.members.push(member);
            return member;
        },
        addString: function(string, name) {
            return this.addMember(new StringMember(string, name));
        },
        addDirectory: function(name) {
            if (!/\/$/.test(name)) {
                name += '/';
            }
            return this.addMember(new DirectoryMember(name));
        },
        addFile: function(url, name) {
            if (!name) {
                var paths = url.split(/\/+/);
                name = paths.pop();
            }
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            xhr.send(null);
            return this.addMember(new StringMember(xhr.responseText, name));
        },
        addFileAsync: function(url, name, callback, errorback) {
            if (!name) {
                var paths = url.split(/\/+/);
                name = paths.pop();
            }
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200 || xhr.status == 0)
                        callback(this.addMember(new StringMember(xhr.responseText, name)), xhr);
                    else
                        errorback(this.addMember(new StringMember(xhr.responseText, name)), xhr);
                }
            };
            xhr.open('GET', url);
            xhr.send(null);
        },
        getByteArray: function() {
            var members = this.members;
            var bin = new ByteArray;
            var push = Array.prototype.push;
            var offsets = [];

            for (var i = 0; i < members.length; i++) {
                offsets.push(bin.length);
                push.apply(bin, members[i].getLocalFileHeader());
                push.apply(bin, members[i].getData());
            }

            var centralDirectoryOffset = bin.length;

            for (var i = 0; i < members.length; i++) {
                push.apply(bin, members[i].getCentralDirectoryFileHeader(offsets[i]));
            }

            var endOfCentralDirectoryOffset = bin.length;

//          end of central dir signature    4 bytes  (0x06054b50)
            bin.append(0x06054b50, 4);
//          number of this disk             2 bytes
            bin.append(0, 2);
//          number of the disk with the
//          start of the central directory  2 bytes
            bin.append(0, 2);
//          total number of entries in the
//          central directory on this disk  2 bytes
            bin.append(members.length, 2);
//          total number of entries in
//          the central directory           2 bytes
            bin.append(members.length, 2);
//          size of the central directory   4 bytes
            bin.append(endOfCentralDirectoryOffset - centralDirectoryOffset, 4);
//          offset of start of central
//          directory with respect to
//          the starting disk number        4 bytes
            bin.append(centralDirectoryOffset, 4);
//          .ZIP file comment length        2 bytes
            bin.append(0, 2);
//          .ZIP file comment       (variable size)
//          Array.prototype.push.apply(bin, []);
            return bin;
        },
        getDataURI: function() {
            return ['data:', this.mimeType, ';base64,', Base64.convertByteArrayToBase64(this.getByteArray())].join('');
        },
        constructor: Zip
    };

    var crc32table = function() {
        var poly = 0xEDB88320, u, table = [];
        for (var i = 0; i < 256; i ++) {
            u = i;
            for (var j = 0; j < 8; j++) {
                if (u & 1)
                    u = (u >>> 1) ^ poly;
                else
                    u = u >>> 1;
            }
            table[i] = u;
        }
        return table;
    } ();

    var getCrc32 = function(bin) {
        var result = 0xFFFFFFFF;
        for (var i = 0; i < bin.length; i ++)
            result = (result >>> 8) ^ crc32table[bin[i] ^ (result & 0xFF)];
        return ~result;
    };

    function ByteArray() {
        var self = [];
        var proto = ByteArray.prototype;
        for (var name in proto)
            self[name] = proto[name];
        return self;
    }
    ByteArray.prototype = {
        append: function(value, bytes) {
            for (var i = 0; i < bytes; i ++)
                this.push(value >> (i * 8) & 0xFF);
        },
        constructor: ByteArray
    };

    function Member() { }
    Member.prototype = {
        initDateTime: function(dt) {
            this.date = ((dt.getFullYear() - 1980) << 9) |
                        ((dt.getMonth() + 1) << 5) |
                        (dt.getDate());
            this.time = (dt.getHours() << 5) |
                        (dt.getMinutes() << 5) |
                        (dt.getSeconds() >> 1);
        },
        getLocalFileHeader: function() {
            var bin = new ByteArray();
//          local file header signature     4 bytes  (0x04034b50)
            bin.append(0x04034b50, 4);
//          version needed to extract       2 bytes
            bin.append(10, 2);
//          general purpose bit flag        2 bytes
            bin.append(0, 2);
//          compression method              2 bytes
            bin.append(0, 2);
//          last mod file time              2 bytes
            bin.append(this.time, 2);
//          last mod file date              2 bytes
            bin.append(this.date, 2);
//          crc-32                          4 bytes
            bin.append(this.crc32, 4);
//          compressed size                 4 bytes
            bin.append(this.data.length, 4);
//          uncompressed size               4 bytes
            bin.append(this.data.length, 4);
//          file name length                2 bytes
            bin.append(this.name.length, 2);
//          extra field length              2 bytes
            bin.append(this.extra.localFile.length, 2);
//          file name (variable size)
            Array.prototype.push.apply(bin, this.name);
//          extra field (variable size)
            Array.prototype.push.apply(bin, this.extra.localFile);
            return bin;
        },
        getData: function() {
            return this.data;
        },
        getCentralDirectoryFileHeader: function(offset) {
            var bin = new ByteArray();
//          central file header signature   4 bytes  (0x02014b50)
            bin.append(0x02014b50, 4);
//          version made by                 2 bytes
            bin.append(0x0317, 2);
//          version needed to extract       2 bytes
            bin.append(10, 2);
//          general purpose bit flag        2 bytes
            bin.append(0, 2);
//          compression method              2 bytes
            bin.append(0, 2);
//          last mod file time              2 bytes
            bin.append(this.time, 2);
//          last mod file date              2 bytes
            bin.append(this.date, 2);
//          crc-32                          4 bytes
            bin.append(this.crc32, 4);
//          compressed size                 4 bytes
            bin.append(this.data.length, 4);
//          uncompressed size               4 bytes
            bin.append(this.data.length, 4);
//          file name length                2 bytes
            bin.append(this.name.length, 2);
//          extra field length              2 bytes
            bin.append(this.extra.centralDirectory.length, 2);
//          file comment length             2 bytes
            bin.append(0, 2);
//          disk number start               2 bytes
            bin.append(0, 2);
//          internal file attributes        2 bytes
            bin.append(0, 2);
//          external file attributes        4 bytes
            bin.append(this.externalFileAttributes, 4);
//          relative offset of local header 4 bytes
            bin.append(offset, 4);
//          file name (variable size)
            Array.prototype.push.apply(bin, this.name);
//          extra field (variable size)
            Array.prototype.push.apply(bin, this.extra.centralDirectory);
//          file comment (variable size)
//          Array.prototype.push.apply(bin, []);
            return bin;
        },
        constructor: Member
    };

    function Extra() {
        this.localFile = new ByteArray;
        this.centralDirectory = new ByteArray;
    }
    Extra.prototype = {
        append: function(field) {
            Array.prototype.push.apply(
                this.localFile,
                field.localFile
            );
            Array.prototype.push.apply(
                this.centralDirectory,
                field.centralDirectory
            );
        },
        contructor: ExtraField
    };

    function ExtraField(magic) {
        this.magic = magic;
    }

    function StringMember(string, name) {
        this.name = Base64.convertUTF16StringToByteArray(name);
        this.data = Base64.convertUTF16StringToByteArray(string);
        this.crc32 = getCrc32(this.data);
        this.externalFileAttributes = 0100644 << 16;
        this.initDateTime(new Date);
        this.extra = new Extra;
    }
    StringMember.prototype = new Member();
    StringMember.constructor = StringMember;

    function DirectoryMember(name) {
        this.name = Base64.convertUTF16StringToByteArray(name);
        this.data = [];
        this.crc32 = getCrc32(this.data);
        this.externalFileAttributes = (040755 << 16) | 0x10; // 0x10 bit for Windows Explorer's Directory
        this.initDateTime(new Date);
        this.extra = new Extra;
    }
    DirectoryMember.prototype = new Member();
    DirectoryMember.constructor = DirectoryMember;

    window.Zip = Zip;
})();
