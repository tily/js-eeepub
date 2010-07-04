
describe('EeePub.NCX', {
    'before': function() {
        ncx = new EeePub.NCX({
            uid:'uid',
            nav:[
                {label:'foo',content:'foo.html'},
                {label:'bar',content:'bar.html'}
            ]
        })
    },
    'should set default values': function() {
        value_of(ncx.depth).should_be(1)
        value_of(ncx.total_page_count).should_be(0)
        value_of(ncx.max_page_number).should_be(0)
        value_of(ncx.doc_title).should_be('Untitled')
    },
    'should make xml': function() {
        default xml namespace = new Namespace('ncx', 'http://www.daisy.org/z3986/2005/ncx/')
        var doc = new XML(ncx.to_xml().replace(/^.*\n/, ''))
        var head = doc.head
        value_of(head).should_not_be(null)

        value_of(head..meta.(@name == 'dtb:uid').@content.toString()).should_be(ncx.uid)
        value_of(head..meta.(@name == 'dtb:depth').@content.toString()).should_be(ncx.depth)
        value_of(head..meta.(@name == 'dtb:totalPageCount').@content.toString()).should_be(ncx.total_page_count)
        value_of(head..meta.(@name == 'dtb:maxPageNumber').@content.toString()).should_be(ncx.max_page_number)
        value_of(doc.docTitle.text.toString()).should_be(ncx.doc_title)

        var nav_map = doc.navMap
        value_of(nav_map).should_not_be(null)
        var nav_points = nav_map.navPoint
        for(var i = 0; i < nav_points.length(); i++) {
            var nav_point = nav_points[i]
            var expect = ncx.nav_map[i]
            value_of(nav_point.function::attribute('id')).should_be('navPoint-' + (i + 1))
            value_of(nav_point.function::attribute('playOrder')).should_be(i + 1)
            value_of(nav_point.navLabel.text.toString()).should_be(expect.label)
            value_of(nav_point.content.@src).should_be(expect.content)
        }
    }
})

describe('EeePub.NCX with nested nav_map', {
    'before': function() {
        (before_each_of('EeePub.NCX'))()
        ncx.nav = [
            {label:'foo',content:'foo.html',
                nav:[
                    {label:'foo-1',content:'foo-1.html'},
                    {label:'foo-2',content:'foo-2.html'}
                ],
            },
            {label:'bar',content:'bar.html'}
        ]
    },
    'should make xml': function() {
        default xml namespace = new Namespace('ncx', 'http://www.daisy.org/z3986/2005/ncx/')
        var doc = new XML(ncx.to_xml().replace(/^.*\n/, ''))
        var nav_map = doc.navMap

        var nav_points = nav_map.navPoint
        for(var i = 0; i < nav_points.length(); i++) {
            var nav_point = nav_points[i]
            var expect = ncx.nav_map[i]
            value_of(nav_point.function::attribute('id')).should_be('navPoint-' + (i + 1))
            value_of(nav_point.function::attribute('playOrder')).should_be(i + 1)
            value_of(nav_point.navLabel.text.toString()).should_be(expect.label)
            value_of(nav_point.content.@src).should_be(expect.content)
        }

        nav_points = nav_map.navPoint.navPoint
        for(var i = 0; i < nav_points.length(); i++) {
            var nav_point = nav_points[i]
            var expect = ncx.nav_map[0].nav_map[i]
            value_of(nav_point.function::attribute('id')).should_be('navPoint-' + (i + 1))
            value_of(nav_point.function::attribute('playOrder')).should_be(i + 1)
            value_of(nav_point.navLabel.text.toString()).should_be(expect.label)
            value_of(nav_point.content.@src).should_be(expect.content)
        }
    }
})

