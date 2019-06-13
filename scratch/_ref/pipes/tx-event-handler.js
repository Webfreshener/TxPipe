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
const {TxPipe} = require("../../index");
const _eventEvent = require("../schemas/pipe-node-event-event");
module.exports = (eventsGetter) => new TxPipe({
    schema: [
        _eventEvent,
        _eventEvent
    ],
    /**
     *
     * @param _
     * @returns {string|*}
     */
    exec: (_) => {
        // if (eventsGetter().indexOf(_.name) === -1) {
        //   const _badParam = _.name;
        //   _ = {
        //       name: "error",
        //       data: `"${_badParam}" is not a registered Event name`,
        //   }
        // }

        if (_.name === "error") {
            return ((typeof _.data) === "object") ? JSON.stringify(_.data) : _.data;
        }

        return _;
    }
});
