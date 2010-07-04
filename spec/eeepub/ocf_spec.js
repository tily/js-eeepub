
describe('EeePub.OCF', {
    'before': function() {
        container = new EeePub.OCF.Container('foo.opf')
    },
    'should return rootfiles': function() {
        value_of(container.rootfiles).should_be([{full_path:'foo.opf',media_type:'application/oebps-package+xml'}])
    },
    'should specify container as String': function() {
        var ocf = new EeePub.OCF({dir:'dir',container:'foo.opf'})
        value_of(ocf.container.rootfiles).should_be([{full_path:'foo.opf',media_type:'application/oebps-package+xml'}])
    },
    'should make xml': function() {
        default xml namespace = new Namespace('container', 'urn:oasis:names:tc:opendocument:xmlns:container')
        var doc = new XML(container.to_xml().replace(/^.*\n/, ''))
        rootfiles = doc.rootfiles
        value_of(rootfiles).should_not_be(null)
        rootfiles = rootfiles.rootfile
        for(var i = 0; i < rootfiles.length(); i++) {
            var expect = container.rootfiles[i]
            value_of(rootfiles[i].attribute('full-path').toString()).should_be(expect.full_path)
            value_of(rootfiles[i].attribute('media-type').toString()).should_be(expect.media_type)
        }
    },
    'should make epub': function() {
    }
})

