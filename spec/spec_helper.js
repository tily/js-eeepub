
function before_each_of(cxt) {
    var cxts = JSSpec.specs.filter(function(e) {
        return e.context == cxt
    })
    if(cxts.length > 0) {
        return cxts[0].beforeEach
    } else {
        return null
    }
}

