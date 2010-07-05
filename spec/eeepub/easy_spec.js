
describe('EeePub.Easy', {
    'before': function() {
        easy = new EeePub.Easy({
            title:'sample',
            creator:'tily',
            identifiers:'http://example.com/book/foo',
            uid:'http://example.com/book/foo',
        })
        easy.sections.push(['1. foo', [
            '<?xml version="1.0" encoding="UTF-8"?>', "\n",
            '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">', "\n",
            '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ja">', "\n",
            '  <head>', "\n",
            '    <title>foo</title>', "\n",
            '  </head>', "\n",
            '  <body>', "\n",
            '    <p>', "\n",
            '    foo foo foo foo foo foo', "\n",
            '    </p>', "\n",
            '  </body>', "\n",
            '</html>', "\n"
        ].join('')])
        easy.sections.push(['2. bar', [
            '<?xml version="1.0" encoding="UTF-8"?>', "\n",
            '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">', "\n",
            '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ja">', "\n",
            '  <head>', "\n",
            '    <title>bar</title>', "\n",
            '  </head>', "\n",
            '  <body>', "\n",
            '    <p>', "\n",
            '    bar bar bar bar bar bar', "\n",
            '    </p>', "\n",
            '  </body>', "\n",
            '</html>', "\n"
        ].join('')])
        easy.assets.push('image.png')
    },
    'spec for prepare': function() {
        easy.save()
    }
})

