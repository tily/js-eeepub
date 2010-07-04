
describe('EeePub.OPF', {
    'before': function() {
        opf = new EeePub.OPF({
            identifier:{value:'978-4-00-310101-8',scheme:'ISBN'},
            files:['foo.html', 'bar.html', 'picture.png'],
            ncx:'toc.ncx'
        })
    },
    'should set default value': function() {
        value_of(opf.toc).should_be('ncx')
        value_of(opf.unique_identifier).should_be('BookId')
        value_of(opf.title).should_be('Untitled')
        value_of(opf.language).should_be('en')
    },
    'should export as xml': function() {
        var ns_opf = new Namespace('opf', 'http://www.idpf.org/2007/opf')
        default xml namespace = ns_opf
        var doc = new XML(opf.to_xml().replace(/^.*\n/, ''))
        var dc = new Namespace('dc', 'http://purl.org/dc/elements/1.1/')

        value_of(doc.attribute('unique-identifier')).should_be(opf.unique_identifier)
        metadata = doc.metadata
        value_of(metadata).should_not_be(null)
        value_of(metadata.dc::title.toString()).should_be(opf.title)
        value_of(metadata.dc::language.toString()).should_be(opf.language)
        value_of(metadata.dc::date.toString()).should_be('')
        value_of(metadata.dc::subject.toString()).should_be('')
        value_of(metadata.dc::description.toString()).should_be('')
        value_of(metadata.dc::relation.toString()).should_be('')
        value_of(metadata.dc::creator.toString()).should_be('')
        value_of(metadata.dc::publisher.toString()).should_be('')
        value_of(metadata.dc::rights.toString()).should_be('')

        var identifier = metadata.dc::identifier
        value_of(identifier.@id.toString()).should_be(opf.unique_identifier)
        //value_of(identifier.@scheme).should_be(opf.identifier.scheme)
        value_of(identifier.toString()).should_be(opf.identifier.value)

        var manifest = doc.manifest
        value_of(manifest).should_not_be(null)
        value_of(manifest.item.length()).should_be(4)
        for(var i = 0; i < 2; i++) {
            var expect = opf.files[i]
            var item = manifest.item[i]
            value_of(item.attribute('id').toString()).should_be(expect)
            value_of(item.attribute('href').toString()).should_be(expect)
            value_of(item.attribute('media-type').toString()).should_be(opf.guess_media_type(expect))
        }
        value_of(manifest.item[3].attribute('id').toString()).should_be('ncx')
        value_of(manifest.item[3].attribute('href').toString()).should_be(opf.ncx)
        value_of(manifest.item[3].attribute('media-type').toString()).should_be(opf.guess_media_type(opf.ncx))

        var spine = doc.spine
        value_of(spine).should_not_be(null)
        spine = spine.itemref
        value_of(spine.length()).should_be(2)
        value_of(spine[0].attribute('idref').toString()).should_be('foo.html')
        value_of(spine[1].attribute('idref').toString()).should_be('bar.html')
    }
})

describe('EeePub.OPF on spec of identifier', {
    'before': function() {
        (before_each_of('EeePub.OPF'))()
    },
    'specify as Array': function() {
        opf.identifier = [{scheme:'ISBN',value:'978-4-00-310101-8'}]
        value_of(opf._identifier()).should_be([{scheme:'ISBN',value:'978-4-00-310101-8'}])
    },
    'specify as Hash': function() {
        opf.identifier = {scheme:'ISBN',value:'978-4-00-310101-8'}
        value_of(opf._identifier()).should_be([{scheme:'ISBN',value:'978-4-00-310101-8',id:opf.unique_identifier}])
    },
    'specify as String': function() {
        opf.identifier = '978-4-00-310101-8'
        value_of(opf._identifier()).should_be([{value:'978-4-00-310101-8',id:opf.unique_identifier}])
    }
})

describe('EeePub.OPF on spec of create_unique_item_id', {
    'before': function() {
        (before_each_of('EeePub.OPF'))()
    },
    'should return unique item id': function() {
      var id_cache = {}
      value_of(opf.create_unique_item_id('foo/bar/test.html', id_cache)).should_be('test.html')
      value_of(opf.create_unique_item_id('foo/bar/test.html', id_cache)).should_be('test.html-1')
      value_of(opf.create_unique_item_id('foo/bar/TEST.html', id_cache)).should_be('TEST.html')
    }
})

describe('EeePub.OPF when ncx is null', {
    'before': function() {
        (before_each_of('EeePub.OPF'))()
        opf.ncx = null
    },
    'should not set ncx to manifest': function() {
        default xml namespace = new Namespace('opf', 'http://www.idpf.org/2007/opf')
        var doc = new XML(opf.to_xml().replace(/^.*\n/, ''))
        value_of(doc.manifest.item.(@id=='ncx').length()).should_be(0)
    }
})

describe('EeePub.OPF when set all metadata', {
    'before': function() {
        (before_each_of('EeePub.OPF'))()
        opf.date = (new Date()).toString()
        opf.subject = 'subject'
        opf.description = 'description'
        opf.relation = 'relation'
        opf.creator = 'creator'
        opf.publisher = 'publisher'
        opf.rights = 'rights'
    },
    'should export as xml': function() {
        var ns_opf = new Namespace('opf', 'http://www.idpf.org/2007/opf')
        default xml namespace = ns_opf
        var doc = new XML(opf.to_xml().replace(/^.*\n/, ''))
        var dc = new Namespace('dc', 'http://purl.org/dc/elements/1.1/')

        var metadata = doc.metadata
        value_of(doc.attribute('unique-identifier')).should_be(opf.unique_identifier)
        value_of(metadata).should_not_be(null)
        value_of(metadata.dc::title.toString()).should_be(opf.title)
        value_of(metadata.dc::language.toString()).should_be(opf.language)
        value_of(metadata.dc::date.toString()).should_be(opf.date)
        value_of(metadata.dc::subject.toString()).should_be('subject')
        value_of(metadata.dc::description.toString()).should_be('description')
        value_of(metadata.dc::relation.toString()).should_be('relation')
        value_of(metadata.dc::creator.toString()).should_be('creator')
        value_of(metadata.dc::publisher.toString()).should_be('publisher')
        value_of(metadata.dc::rights.toString()).should_be('rights')

        var identifier = metadata.dc::identifier
        value_of(identifier.@id.toString()).should_be(opf.unique_identifier)
        //value_of(identifier.@scheme).should_be(opf.identifier.scheme)
        value_of(identifier.toString()).should_be(opf.identifier.value)
    }
})

describe('EeePub.OPF when plural identifiers', {
    'before': function() {
        (before_each_of('EeePub.OPF'))()
        opf.identifier = [
            {id:'BookId',scheme:'ISBN',value:'978-4-00-310101-8'},
            {id:'BookURL',scheme:'URL',value:'http://example.com/books/foo'}
        ]
    },
    'should export as xml': function() {
        default xml namespace = new Namespace('opf', 'http://www.idpf.org/2007/opf')
        var doc = new XML(opf.to_xml().replace(/^.*\n/, ''))
        var dc = new Namespace('dc', 'http://purl.org/dc/elements/1.1/')

        var elements = doc.metadata.dc::identifier
        value_of(elements.length()).should_be(2)
        for(var i = 0; i < elements.length(); i++) {
            var element = elements[i]
            var expect = opf.identifier[i]
            value_of(element.@id.toString()).should_be(expect.id)
            //value_of(element.@scheme.toString()).should_be(expect.scheme)
            value_of(element.toString()).should_be(expect.value)
        }
    }
})

describe('EeePub.OPF when plural languages', {
    'before': function() {
        (before_each_of('EeePub.OPF'))()
        opf.language = ['ja', 'en']
    },
    'should export as xml': function() {
        var ns_opf = new Namespace('opf', 'http://www.idpf.org/2007/opf')
        default xml namespace = ns_opf
        var doc = new XML(opf.to_xml().replace(/^.*\n/, ''))
        var dc = new Namespace('dc', 'http://purl.org/dc/elements/1.1/')

        var elements = doc.metadata.dc::language
        value_of(elements.length()).should_be(2)
        for(var i = 0; i < elements.length(); i++) {
            var element = elements[i]
            var expect = opf.language[i]
            value_of(element.toString()).should_be(expect)
        }
    }
})

describe('EeePub.OPF when specify spine', {
    'before': function() {
        (before_each_of('EeePub.OPF'))()
        opf.spine = ['a', 'b']
    },
    'should export as xml': function() {
        default xml namespace = new Namespace('opf', 'http://www.idpf.org/2007/opf')
        var doc = new XML(opf.to_xml().replace(/^.*\n/, ''))

        var spine = doc.spine
        value_of(spine).should_not_be(null)
        spine = spine.itemref
        value_of(spine.length()).should_be(2)
        value_of(spine[0].@idref).should_be('a')
        value_of(spine[1].@idref).should_be('b')
    }
})

describe('EeePub.OPF when specify manifest as Hash', {
    'before': function() {
        (before_each_of('EeePub.OPF'))()
        opf.manifest = [
            {id:'foo',href:'foo.html',media_type:'application/xhtml+xml'},
            {id:'bar',href:'bar.html',media_type:'application/xhtml+xml'},
            {id:'picture',href:'picture.png',media_type:'image/png'}
        ]
    },
    'should export as xml': function() {
        default xml namespace = new Namespace('opf', 'http://www.idpf.org/2007/opf')
        var doc = new XML(opf.to_xml().replace(/^.*\n/, ''))

        var manifest = doc.manifest
        value_of(manifest).should_not_be(null)
        value_of(manifest.item.length()).should_be(4)
        for(var i = 0; i < 2; i++) {
            var expect = opf.manifest[i]
            var item = manifest.item[i]
            value_of(item.attribute('id').toString()).should_be(expect.id)
            value_of(item.attribute('href').toString()).should_be(expect.href)
            value_of(item.attribute('media-type').toString()).should_be(expect.media_type)
        }
        value_of(manifest.item[3].attribute('id').toString()).should_be('ncx')
        value_of(manifest.item[3].attribute('href').toString()).should_be(opf.ncx)
    }
})

describe('EeePub.OPF when specify dc:date[event]', {
    'before': function() {
        (before_each_of('EeePub.OPF'))()
        opf.date = {value:(new Date()).toString(),event:'publication'}
    },
    'should export as xml': function() {
        default xml namespace = new Namespace('opf', 'http://www.idpf.org/2007/opf')
        var doc = new XML(opf.to_xml().replace(/^.*\n/, ''))
        var dc = new Namespace('dc', 'http://purl.org/dc/elements/1.1/')

        metadata = doc.metadata
        var date = metadata.dc::date
        value_of(date.toString()).should_be(opf.date.value)
        value_of(date.@event.toString()).should_be(opf.date.event)
    }
})

describe('EeePub.OPF when set guide', {
    'before': function() {
        (before_each_of('EeePub.OPF'))()
        opf.guide = [
            {type:'toc',title:'Table of Contents',href:'toc.html'},
            {type:'loi',title:'List Of Illustrations',href:'toc.html#figures'}
        ]
    },
    'should export as xml': function() {
        default xml namespace = new Namespace('opf', 'http://www.idpf.org/2007/opf')
        var doc = new XML(opf.to_xml().replace(/^.*\n/, ''))

        var guide = doc.guide
        value_of(guide).should_not_be(null)
        references = guide.reference
        value_of(references.length()).should_be(2)
        for(var i = 0; i < references.length(); i++) {
            var expect = opf.guide[i]
            value_of(references[i].@type.toString()).should_be(expect.type)
            value_of(references[i].@title.toString()).should_be(expect.title)
            value_of(references[i].@href.toString()).should_be(expect.href)
        }
    }
})

