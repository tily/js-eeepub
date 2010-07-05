
describe('EeePub.Maker', {
    'before': function() {
        maker = new EeePub.Maker({
            title:'sample',
            creator:'tily',
            publisher:'tily.github.com',
            date:"2010-05-06",
            language:'en',
            subject:'epub sample',
            description:'this is epub sample',
            rights:'xxx',
            relation:'xxx',
            identifiers:'http://example.com/book/foo', scheme: 'URL',
            uid:'http://example.com/book/foo',
            ncx_file:'toc.ncx',
            opf_file:'content.opf',
            files: ['./fixture/foo.html', './fixture/bar.html'],
            nav: [
              {label:'1. foo',content:'foo.html'},
              {label:'1. bar',content:'bar.html'}
            ]
        })
    },
    'should save': function() {
        maker.save()
    }
})

