//----[preparation]------------------------------------
var EeePub = {}
EeePub.registerTags = function() {
    var tags = [
        'ncx',       'docTitle',  'navMap',   // for EeePub.NCX
        'navPoint',  'navLabel',  'content',
        'container', 'rootfiles', 'rootfile', // for EeePub.OCF
        'package',   'metadata',  'manifest', // for EeePub.OPF
        'item',      'spine',     'itemref',
        'guide',     'reference'
    ]
    for(var i = 0; i < tags.length; i++) {
        XmlBuilder.registerTag(tags[i])
    }
    XmlBuilder.registerTag(tags[i])
}
EeePub.registerTags()

//----[Eeepub.Util]-----------------------------------
EeePub.Util = {
    extend: function(s, c) {
        for (var p in s.prototype) {
            c.prototype[p] = s.prototype[p]
        }
    },
    basename: function(filename) {
        if(filename.match(/\//)) {
            return filename.match(/(.*)\/(.*)/)[2]
        } else {
            return filename
        }
    }
}
//----[Eeepub.ContainerItem]--------------------------
EeePub.ContainerItem = function(arg) {
    set_values(arg)
}
EeePub.ContainerItem.prototype = {
    attr_alias: function(name, src) {
        if(this[name]) this[src] = this[name]
    },
    default_value: function(name, value) {
        if(!this[name]) this[name] = value
    },
    set_values: function(values) {
        for(var k in values) {
            this[k] = values[k]
        }
    },
    to_xml: function() {
        var builder = new XmlBuilder()
        this.build_xml(builder)
        var xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" + builder.toString()
        return xml
    },
    save: function(filename, zip) {
         zip.addString(this.to_xml(), filename)
    },
    guess_media_type: function(filename) {
        if(filename.match(/.*\.html?$/i)) {
            return 'application/xhtml+xml'
        } else if(filename.match(/.*\.css$/i)) {
            return 'text/css'
        } else if(filename.match(/.*\.(jpeg|jpg)$/)) {
            return 'image/jpeg'
        } else if(filename.match(/.*\.png$/i)) {
            return 'image/png'
        } else if(filename.match(/.*\.gif$/i)) {
            return 'image/gif'
        } else if(filename.match(/.*\.svg$/i)) {
            return 'image/svg+xml'
        } else if(filename.match(/.*\.ncx$/i)) {
            return 'application/x-dtbncx+xml'
        } else if(filename.match(/.*\.opf$/i)) {
            return 'application/oebps-package+xml'
        }
    },
    convert_to_xml_attributes: function(obj) {
        result = {}
        for(var k in obj) {
            key = k.replace(/_/g, '-')
            result[key] = obj[k]
        }
        return result
    }
}
//----[Eeepub.NCX]------------------------------------
EeePub.NCX = function(arg) {
    this.set_values(arg)
    this.attr_alias('title', 'doc_title')
    this.attr_alias('nav', 'nav_map')
    this.default_value('depth', 1)
    this.default_value('total_page_count', 0)
    this.default_value('max_page_number', 0)
    this.default_value('doc_title', 'Untitled')
}
EeePub.NCX.prototype = {
    build_xml: function(builder) {
        var that = this
        builder.ncx({xmlns:'http://www.daisy.org/z3986/2005/ncx/',version:'2005-1'},function() {
            builder.docTitle(function() { builder.tag('text', that.doc_title) })
            that.build_head(builder)
            that.build_nav_map(builder)
        })
    },
    build_head: function(builder) {
        var that = this
        with(builder) {
            head(function() {
                var metas = {
                    uid:that.uid,
                    depth:that.depth,
                    totalPageCount:that.total_page_count,
                    maxPageNumber:that.max_page_number
                }
                for(var key in metas) {
                    meta({name:'dtb:'+ key, content:metas[key]})
                }
            })
        }
    },
    build_nav_map: function(builder) {
        var that = this
        builder.navMap(function() {
            that.builder_nav_point(builder, that.nav_map, 1)
        })
    },
    builder_nav_point: function(builder, nav_point, play_order) {
        if(nav_point instanceof Array) {
            for(var i = 0; i < nav_point.length; i++) {
                play_order = this.builder_nav_point(builder, nav_point[i], play_order)
            }
        } else {
            var that = this
            var id = nav_point.id || 'navPoint-' + play_order
            builder.navPoint({id:id,playOrder:play_order}, function() {
                builder.navLabel(function() { builder.tag('text', nav_point.label) })
                builder.content({src:nav_point.content})
                play_order++
                if(nav_point.nav) {
                    play_order = that.builder_nav_point(builder, nav_point.nav, play_order)
                }
            })
        }
        return play_order
    }
}
EeePub.Util.extend(EeePub.ContainerItem, EeePub.NCX)

//----[Eeepub.OCF]------------------------------------
EeePub.OCF = function(arg) {
    for(var k in arg) {
        if(k == 'container') {
            this.set_container(arg[k])
        } else {
            this[k] = arg[k]
        }
    }
}
EeePub.OCF.prototype = {
    set_container: function(arg) {
        this.container = new EeePub.OCF.Container(arg)
    },
    save: function(zip) {
        var meta_inf = 'META-INF'
        zip.addString('application/epub+zip', 'mimetype')
        zip.addDirectory(meta_inf)
        zip.addString(this.container.to_xml(), meta_inf + '/container.xml')
    }
}
EeePub.OCF.Container = function(arg) {
    this.rootfiles = []
    if(typeof arg == 'string') {
        this.rootfiles = [{full_path:arg,media_type:this.guess_media_type(arg)}]
    } else if(arg instanceof Array) {
        for(var i = 0; i < arg.length; i++) {
            this.rootfiles.push({
                full_path:arg,media_type:this.guess_media_type(arg)
            })
        }
    } else {
        this.rootfiles = arg
    }
}
EeePub.OCF.Container.prototype = {
    build_xml: function(builder) {
        var that = this
        builder.container({xmlns:'urn:oasis:names:tc:opendocument:xmlns:container', version:'1.0'}, function() {
            builder.rootfiles(function() {
                for(var i = 0; i < that.rootfiles.length; i++) {
                    builder.rootfile(that.convert_to_xml_attributes(that.rootfiles[i]))
                }
            })
        })
    }
}
EeePub.Util.extend(EeePub.ContainerItem, EeePub.OCF.Container)

//----[Eeepub.OPF]------------------------------------
EeePub.OPF = function(arg) {
    this.set_values(arg)
    this.attr_alias('files', 'manifest')
    this.default_value('toc', 'ncx')
    this.default_value('unique_identifier', 'BookId')
    this.default_value('title', 'Untitled')
    this.default_value('language', 'en')
}
EeePub.OPF.prototype = {
    _identifier : function() {
        if(this.identifier instanceof Array) {
            return this.identifier
        } else if(typeof this.identifier == 'string') {
            return [{value:this.identifier,id:this.unique_identifier}]
        } else if(typeof this.identifier == 'object') {
            this.identifier.id = this.unique_identifier
            return [this.identifier]
        } else {
            return this.identifier
        }
    },
    _spine: function() {
        if(this.spine) return this.spine
        var spine = []
        var manifest = this.complete_manifest()
        for(var i = 0; i < manifest.length; i++) {
            if(manifest[i].media_type == 'application/xhtml+xml') {
                spine.push(manifest[i].id)
            }
        }
        return spine
    },
    build_xml: function(builder) {
        var that = this
        builder.package({
            xmlns:'http://www.idpf.org/2007/opf',
            'unique-identifier':this.unique_identifier,
            version:'2.0'
        },function() {
            that.build_metadata(builder)
            that.build_manifest(builder)
            that.build_spine(builder)
            that.build_guide(builder)
        })
    },
    build_metadata: function(builder) {
        var that = this
        builder.metadata({
            'xmlns:dc':'http://purl.org/dc/elements/1.1/',
            'xmlns:dcterms':'http://purl.org/dc/terms/',
            'xmlns:xsi':'http://www.w3.org/2001/XMLSchema-instance',
            'xmlns:opf':'http://www.idpf.org/2007/opf'
        }, function() {
            var identifier = that._identifier()
            for(var i = 0; i < identifier.length; i++) {
                var attrs = {}
                if(identifier[i].scheme) {
                    attrs['opf:scheme'] = identifier[i].scheme
                }
                if(identifier[i].id) {
                    attrs.id = identifier[i].id
                }
                builder.tag('dc:identifier', attrs, identifier[i].value)
            }
            var tags = ['title', 'language', 'subject', 'description', 'relation', 'creator', 'publisher', 'date', 'rights']
            for(var i = 0; i < tags.length; i++) {
                var tag = tags[i]
                if(!that[tag]) continue
                if(that[tag] instanceof Array) {
                    for(var i = 0; i < that[tag].length; i++) {
                        builder.tag('dc:' + tag, that[tag][i])
                    }
                } else if(that[tag].value != undefined) {
                    var attr = {}
                    for(var k in that[tag]) {
                       if(k != 'value') attr[k] = that[tag][k]
                    }
                    builder.tag('dc:' + tag, that.convert_to_xml_attributes(attr), that[tag].value)
                } else {
                    builder.tag('dc:' + tag, {}, that[tag])
                }
            }
        })
    },
    build_manifest: function(builder) {
        var manifest = this.complete_manifest()
        builder.manifest(function() {
            for(var i = 0; i < manifest.length; i++) {
                builder.item({
                    id:manifest[i].id,
                    href:manifest[i].href,
                    'media-type':manifest[i].media_type
                })
            }
        })
    },
    build_spine: function(builder) {
        var spine = this._spine()
        builder.spine({toc:this.toc},function() {
            for(var i = 0; i < spine.length; i++) {
                builder.itemref({idref:spine[i]})
            }
        })
    },
    build_guide: function(builder) {
        var that = this
        if(this.guide == undefined || this.guide.length == 0) {
            return
        }

        builder.guide(function() {
            for(var i = 0; i < that.guide.length; i++) {
                builder.reference(that.guide[i])
            }
        })
    },
    complete_manifest: function() {
        var item_id_cache = {}

        result = []
        for(var i = 0; i < this.manifest.length; i++) {
            if(typeof this.manifest[i] == 'string') {
                var id = this.create_unique_item_id(this.manifest[i], item_id_cache)
                var href = this.manifest[i]
                var media_type = this.guess_media_type(this.manifest[i])
            } else {
                var id = this.manifest[i].id || create_unique_item_id(this.manifest[i].href, item_id_cache)
                var href = this.manifest[i].href
                var media_type = this.manifest[i].media_type || this.guess_media_type(this.manifest[i].href)
            }
            result.push({id:id,href:href,'media_type':media_type})
        }

        if(this.ncx) {
            result.push({id:'ncx',href:this.ncx,'media_type':'application/x-dtbncx+xml'})
        }
        return result
    },
    create_unique_item_id: function(filename, id_cache) {
        basename = EeePub.Util.basename(filename)
        if(!id_cache[basename]) {
            id_cache[basename] = 0
            name = basename
        } else {
            name = basename + '-' + id_cache[basename]
        }
        id_cache[basename] += 1
        return name
    }
}
EeePub.Util.extend(EeePub.ContainerItem, EeePub.OPF)

//----[Eeepub.Maker]------------------------------------
EeePub.Maker = function(arg) {
    this.files = []
    this.nav = []
    this.ncx_file = 'toc.ncx'
    this.opf_file = 'content.opf'
    for(var k in arg) this[k] = arg[k]
}
EeePub.Maker.prototype = {
    save: function(filename) {
        var zip = new Zip()
        for(var i = 0; i < this.files.length; i++) {
            // TODO: take path and dir
            zip.addFile(this.files[i], this.files[i])
        }
        new EeePub.NCX({
            uid:   this.uid,
            title: this.title,
            nav:   this.nav
        }).save(this.ncx_file, zip)
        new EeePub.OPF({
            title:       this.title,
            identifier:  this.identifiers,
            creator:     this.creator,
            publisher:   this.publisher,
            date:        this.date,
            language:    this.language,
            subject:     this.subject,
            description: this.description,
            rights:      this.rights,
            relation:    this.relation,
            manifest:    this.files,
            ncx:         this.ncx_file
        }).save(this.opf_file, zip)
        new EeePub.OCF({
            dir:       this.dir,
            container: this.opf_file
        }).save(zip)
        return zip.getDataURI()
    }
}

//----[Eeepub.Easy]------------------------------------
EeePub.Easy = function(arg) {
    EeePub.Maker.apply(this, [arg])
    this.sections = []
    this.assets = []
}
EeePub.Easy.prototype = {
    save: function(filename) {
        var zip = new Zip()
        this.prepare(zip)
        new EeePub.NCX({
            uid:   this.uid,
            title: this.title,
            nav:   this.nav
        }).save(this.ncx_file, zip)
        new EeePub.OPF({
            title:       this.title,
            identifier:  this.identifiers,
            creator:     this.creator,
            publisher:   this.publisher,
            date:        this.date,
            language:    this.language,
            subject:     this.subject,
            description: this.description,
            rights:      this.rights,
            relation:    this.relation,
            manifest:    this.files,
            ncx:         this.ncx_file
        }).save(this.opf_file, zip)
        new EeePub.OCF({
            dir:       this.dir,
            container: this.opf_file
        }).save(zip)
        return zip.getDataURI()
    },
    prepare: function(zip) {
        var filenames = []
        for(var i = 0; i < this.sections.length; i++) {
            var filename = 'section_' + i + '.html'
            zip.addString(this.sections[i][1], filename)
            filenames.push(filename)
        }

        for(var i = 0; i < this.assets.length; i++) {
        }
        this.files = filenames
        this.nav = []
        for(var i = 0; i < this.files.length; i++) {
            this.nav.push({label:this.sections[i][0],content:filenames[i]})
        }
    }
}
