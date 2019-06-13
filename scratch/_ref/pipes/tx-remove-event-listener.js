/* ############################################################################
The MIT License (MIT)

Copyright (c) 2019 Van Schroeder
Copyright (c) 2019 Webfreshener, LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

############################################################################ */
const EventEmitter = require("events");
module.exports = (emitter) => ({
    exec: (__) => {
        const _rmEvents = [];
        if (emitter instanceof EventEmitter) {
            __.events.forEach((_evt) => {
                _rmEvents[_rmEvents.length] = _evt;
                emitter.off(_evt, (data) => {
                    __.handler.txWrite({
                        name: _evt,
                        data: data,
                    });
                });
            });
        }

        return {
            events: __.events.filter((evt) => _rmEvents.indexOf(evt) === -1)
        };
    }
});
/*
if (emitter instanceof EventEmitter) {
    union(["error"], events).forEach((_) => {
        _addEvents[_addEvents.length] = _;
        _eOC["emitter"].off(_, (data) => {
            _handlers.get(_self).txWrite({
                name: _,
                data: data,
            });
        });
    });
}
*/
