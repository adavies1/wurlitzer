import { use, expect } from 'chai';
import sinon from 'sinon';
import * as utils from '../../src/utils';

describe('Utils tests', () => {
    const buffer = new ArrayBuffer(11);
    const view = new DataView(buffer);

    before(() => {
        // Fill the array buffer with characters (using a dataview)
        "hello there".split('').forEach((letter, index) => {
            view.setInt8(index, letter.charCodeAt(0));
        });
    });

    // loadFileFromDisk
    describe('loadFileFromDisk tests', () => {
        it('Should read song data from a file without errors', () => {
            return utils.loadFileFromDisk(global.config.modFilePath)
            .then(dataArrayBuffer => {
                expect(dataArrayBuffer.constructor).to.equal(ArrayBuffer);
                expect(dataArrayBuffer.byteLength).to.equal(46814);
                expect(utils.readStringFromArrayBuffer(dataArrayBuffer, 1080, 1084)).to.equal('M.K.');
            });
        });
    });

    // loadFileFromUrl tests
    describe('loadFileFromUrl tests', () => {
        it('Should read data from a URL without errors', () => {
            var p = utils.loadFileFromUrl('http://www.test_url.com/fake.mod');
            return p.then(dataArrayBuffer => {
                expect(dataArrayBuffer.constructor).to.equal(ArrayBuffer);
                expect(dataArrayBuffer.byteLength).to.equal(46814);
                expect(utils.readStringFromArrayBuffer(dataArrayBuffer, 1080, 1084)).to.equal('M.K.');
            });
        });
    });

    // readBigEndian16bitInt
    describe('readBigEndian16bitInt tests', () => {
        it('Should return the integer 26725', () => {
            expect(utils.readBigEndian16bitInt(buffer, 0)).to.equal(26725);
        });
        it('Should return the integer 28448', () => {
            expect(utils.readBigEndian16bitInt(buffer, 4)).to.equal(28448);
        });
    });

    // readBigEndian8bitInt
    describe('readBigEndian8bitInt tests', () => {
        it('Should return the integer 104', () => {
            expect(utils.readBigEndian8bitInt(buffer, 0)).to.equal(104);
        });
        it('Should return the integer 111', () => {
            expect(utils.readBigEndian8bitInt(buffer, 4)).to.equal(111);
        });
    });

    // readStringFromArrayBuffer
    describe('readStringFromArrayBuffer tests', () => {
        it('Read from start to position', () => {
            expect(utils.readStringFromArrayBuffer(buffer, 0, 5)).to.equal('hello');
        });
        it('Read from position to position', () => {
            expect(utils.readStringFromArrayBuffer(buffer, 1, 5)).to.equal('ello');
        });
        it('Read from position to end', () => {
            expect(utils.readStringFromArrayBuffer(buffer, 6)).to.equal('there');
        });
    });

    after(() => {

    });
})