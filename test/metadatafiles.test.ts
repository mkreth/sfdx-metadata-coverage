/*
 * Copyright (c) 2021, Magnus Kreth.
 * All rights reserved.
 * Licensed under the MIT license.
 * For full license text, see file LICENSE.txt in the repository root.
 */

import fs = require('fs');
import sinon = require('sinon');
import { expect, use as chaiUse } from 'chai';
import chaiAsPromised = require('chai-as-promised');
import findMetadataFiles from '../src/metadatafiles';
import * as recursivereaddir from '../src/recursivereaddir';

chaiUse(chaiAsPromised);

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-var-requires
const sandbox = require('sinon').createSandbox();

const prepareFsStubs = function () {
  /* eslint-disable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment */

  const rrdStub = sandbox.stub(recursivereaddir, 'recursiveReaddir');

  rrdStub
    .withArgs('src', sinon.match.any)
    .resolves([
      'src/classes/Foo.cls-meta.xml',
      'src/objects/Foo__c/Foo__c.object-meta.xml',
      'src/objects/Foo__c/fields/DummyField__c.field-meta.xml',
    ]);
  rrdStub.withArgs('src/classes', sinon.match.any).resolves(['src/classes/Foo.cls-meta.xml']);
  rrdStub.withArgs('src2', sinon.match.any).rejects(new Error("ENOENT: no such file or directory, scandir 'src2'"));
  rrdStub.withArgs('error1', sinon.match.any).resolves(['error1/classes/Foo.cls-meta.xml']);
  rrdStub.withArgs('error2', sinon.match.any).resolves(['error2/classes/Foo.cls-meta.xml']);
  rrdStub.withArgs('error3', sinon.match.any).resolves(['error3/classes/Foo.cls-meta.xml']);
  rrdStub.withArgs('error4', sinon.match.any).resolves(['error4/classes/Foo.cls-meta.xml']);

  const readFileStub = sandbox.stub(fs, 'readFile');

  const metadataXml = [
    {
      path: 'src/classes/Foo.cls-meta.xml',
      xml: `<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="urn:metadata.tooling.soap.sforce.com" fqn="Foo">
</ApexClass>`,
    },
    {
      path: 'src/objects/Foo__c/Foo__c.object-meta.xml',
      xml: `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
</CustomObject>`,
    },
    {
      path: 'src/objects/Foo__c/fields/DummyField__c.field-meta.xml',
      xml: `<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
</CustomField>`,
    },
    {
      path: 'error1/classes/Foo.cls-meta.xml',
      xml: '',
    },
    {
      path: 'error2/classes/Foo.cls-meta.xml',
      xml: 'GARBAGE',
    },
    {
      path: 'error3/classes/Foo.cls-meta.xml',
      xml: '<?xml version="1.0" encoding="UTF-8"?>',
    },
  ];
  metadataXml.forEach((mdFile) => {
    readFileStub.withArgs(mdFile.path).callsArgWith(1, null, mdFile.xml);
  });
  readFileStub.withArgs('error4/classes/Foo.cls-meta.xml').callsArgWith(1, new Error('failed'), null);
};

describe('findMetadataFiles', function () {
  beforeEach(function () {
    prepareFsStubs();
  });

  afterEach(function () {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    sandbox.restore();
  });

  it('should return metadata files from package directories', async function () {
    const expected = [
      {
        path: 'src/classes/Foo.cls-meta.xml',
        fileName: 'Foo.cls',
        folder: 'src/classes',
        type: 'ApexClass',
      },
      {
        path: 'src/objects/Foo__c/Foo__c.object-meta.xml',
        fileName: 'Foo__c.object',
        folder: 'src/objects/Foo__c',
        type: 'CustomObject',
      },
      {
        path: 'src/objects/Foo__c/fields/DummyField__c.field-meta.xml',
        fileName: 'DummyField__c.field',
        folder: 'src/objects/Foo__c/fields',
        type: 'CustomField',
      },
    ];
    const metadataFiles = await findMetadataFiles('src');
    expect(metadataFiles).to.deep.eq(expected);
  });

  it('should return metadata files from sourcepaths', async function () {
    const expected = [
      {
        path: 'src/classes/Foo.cls-meta.xml',
        fileName: 'Foo.cls',
        folder: 'src/classes',
        type: 'ApexClass',
      },
    ];
    const metadataFiles = await findMetadataFiles('src/classes');
    expect(metadataFiles).to.deep.eq(expected);
  });

  it('should throw an error when no directories given', async function () {
    await expect(findMetadataFiles()).to.be.rejectedWith('no directories with metadata files');
  });

  it('should throw an error when a directory does not exist', async function () {
    await expect(findMetadataFiles('src', 'src2')).to.be.rejectedWith(
      "ENOENT: no such file or directory, scandir 'src2'"
    );
  });

  describe('should throw an error when a metadata file is invalid', function () {
    it('empty metadata file', async function () {
      await expect(findMetadataFiles('error1')).to.be.rejectedWith(
        'could not read metadata file error1/classes/Foo.cls-meta.xml'
      );
    });

    it('file names ...-meta.xml but not a XML file', async function () {
      await expect(findMetadataFiles('error2')).to.be.rejectedWith(
        'could not read metadata file error2/classes/Foo.cls-meta.xml - caused by: Non-whitespace before first tag.\nLine: 0\nColumn: 1\nChar: G'
      );
    });

    it('metadata file with only xml preamble', async function () {
      await expect(findMetadataFiles('error3')).to.be.rejectedWith(
        'could not read metadata file error3/classes/Foo.cls-meta.xml'
      );
    });

    it('metadata file not readable', async function () {
      await expect(findMetadataFiles('error4')).to.be.rejectedWith(
        'could not read metadata file error4/classes/Foo.cls-meta.xml - caused by: failed'
      );
    });
  });
});
