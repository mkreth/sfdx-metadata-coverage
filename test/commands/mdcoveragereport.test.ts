/*
 * Copyright (c) 2021, Magnus Kreth.
 * All rights reserved.
 * Licensed under the MIT license.
 * For full license text, see file LICENSE.txt in the repository root.
 */

import fs = require('fs');
import { $$, test, expect } from '@salesforce/command/lib/test';
import { SfdxProject } from '@salesforce/core';
import fetch from 'node-fetch';
import { SinonStub } from 'sinon';
import { MetadataCoverageReport } from '../../src/coveragereport';
import * as recursivereaddir from '../../src/recursivereaddir';

import type { RecursiveReaddirIgnores } from '../../src/recursivereaddir';

type MetadataCoverageReportVersions = {
  selected: number;
  max: number;
  min: number;
};

type MetadataCoverageReportResponse = {
  types: MetadataCoverageReport;
  versions: MetadataCoverageReportVersions;
};

type MetadataFileCoverage = {
  file: {
    path: string;
    fileName: string;
    folder: string;
    type: string;
  };
  metadataApi?: boolean;
  sourceTracking?: boolean;
  unlockedPackagingWithoutNamespace?: boolean;
  unlockedPackagingWithNamespace?: boolean;
  managedPackaging?: boolean;
  changeSets?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-var-requires
const MetadataCoverageReportApi52: MetadataCoverageReportResponse = require('../metadatacoveragereport52.json');

describe('mdcoverage:report', () => {
  function stubMetadataCoverageReport() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sandbox: any = $$.SANDBOX;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    sandbox.stub(fetch, 'Promise').returns(
      Promise.resolve({
        json: () => Promise.resolve(MetadataCoverageReportApi52),
      })
    );
  }

  test
    .do(() => {
      $$.SANDBOX.stub(SfdxProject.prototype, 'getUniquePackageDirectories').returns([
        { name: 'force-app', path: 'force-app', fullPath: '' },
      ]);

      const stub = $$.SANDBOX.stub(recursivereaddir, 'recursiveReaddir') as unknown;
      const recursiveReaddirStub = stub as SinonStub<[string, RecursiveReaddirIgnores], Promise<string[]>>;

      recursiveReaddirStub
        .withArgs($$.SANDBOX.match.any, $$.SANDBOX.match.any)
        .rejects('recursiveReaddir NOT STUBBED for this arg')
        .withArgs('force-app', $$.SANDBOX.match.any)
        .resolves([
          'force-app/assignmentRules/Case.assignmentRules-meta.xml',
          'force-app/classes/ClsOne.cls-meta.xml',
          'force-app/objects/Account/fields/FldOne.field-meta.xml',
          'force-app/objects/ObjOne__c/ObjOne__c.object-meta.xml',
        ]);

      $$.SANDBOX.stub(fs, 'readFile')
        .callThrough()
        .withArgs('force-app/assignmentRules/Case.assignmentRules-meta.xml', $$.SANDBOX.match.any)
        .callsArgWith(
          1,
          null,
          `<?xml version="1.0" encoding="UTF-8"?>
<AssignmentRules xmlns="http://soap.sforce.com/2006/04/metadata"/>`
        )
        .withArgs('force-app/classes/ClsOne.cls-meta.xml', $$.SANDBOX.match.any)
        .callsArgWith(
          1,
          null,
          `<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="urn:metadata.tooling.soap.sforce.com" fqn="ClsOne">
</ApexClass>`
        )
        .withArgs('force-app/objects/Account/fields/FldOne.field-meta.xml', $$.SANDBOX.match.any)
        .callsArgWith(
          1,
          null,
          `<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
</CustomField>`
        )
        .withArgs('force-app/objects/ObjOne__c/ObjOne__c.object-meta.xml', $$.SANDBOX.match.any)
        .callsArgWith(
          1,
          null,
          `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
</CustomObject>`
        );

      stubMetadataCoverageReport();
    })
    .stdout()
    .stderr()
    .command(['mdcoverage:report'])
    .it('should run successful', () => {
      expect(process.exitCode).to.equal(0);
    });

  test
    .do(() => {
      $$.SANDBOX.stub(SfdxProject.prototype, 'getUniquePackageDirectories').returns([
        { name: 'force-app', path: 'force-app', fullPath: '' },
      ]);

      const stub = $$.SANDBOX.stub(recursivereaddir, 'recursiveReaddir') as unknown;
      const recursiveReaddirStub = stub as SinonStub<[string, RecursiveReaddirIgnores], Promise<string[]>>;

      recursiveReaddirStub
        .withArgs($$.SANDBOX.match.any, $$.SANDBOX.match.any)
        .rejects('recursiveReaddir NOT STUBBED for this arg')
        .withArgs('force-app', $$.SANDBOX.match.any)
        .resolves([]);

      stubMetadataCoverageReport();
    })
    .stdout()
    .stderr()
    .command(['mdcoverage:report'])
    .it('should gracefully exit when no metadata files exist', () => {
      expect(process.exitCode).to.equal(0);
    });

  test
    .do(() => {
      $$.SANDBOX.stub(SfdxProject.prototype, 'getUniquePackageDirectories').returns([
        { name: 'force-app', path: 'force-app', fullPath: '' },
      ]);

      const stub = $$.SANDBOX.stub(recursivereaddir, 'recursiveReaddir') as unknown;
      const recursiveReaddirStub = stub as SinonStub<[string, RecursiveReaddirIgnores], Promise<string[]>>;

      recursiveReaddirStub
        .withArgs($$.SANDBOX.match.any, $$.SANDBOX.match.any)
        .rejects('recursiveReaddir NOT STUBBED for this arg')
        .withArgs('force-app', $$.SANDBOX.match.any)
        .resolves([
          'force-app/assignmentRules/Case.assignmentRules-meta.xml',
          'force-app/classes/ClsOne.cls-meta.xml',
          'force-app/objects/Account/fields/FldOne.field-meta.xml',
          'force-app/objects/ObjOne__c/ObjOne__c.object-meta.xml',
        ]);

      $$.SANDBOX.stub(fs, 'readFile')
        .callThrough()
        .withArgs('force-app/assignmentRules/Case.assignmentRules-meta.xml', $$.SANDBOX.match.any)
        .callsArgWith(
          1,
          null,
          `<?xml version="1.0" encoding="UTF-8"?>
<AssignmentRules xmlns="http://soap.sforce.com/2006/04/metadata"/>`
        )
        .withArgs('force-app/classes/ClsOne.cls-meta.xml', $$.SANDBOX.match.any)
        .callsArgWith(
          1,
          null,
          `<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="urn:metadata.tooling.soap.sforce.com" fqn="ClsOne">
</ApexClass>`
        )
        .withArgs('force-app/objects/Account/fields/FldOne.field-meta.xml', $$.SANDBOX.match.any)
        .callsArgWith(
          1,
          null,
          `<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
</CustomField>`
        )
        .withArgs('force-app/objects/ObjOne__c/ObjOne__c.object-meta.xml', $$.SANDBOX.match.any)
        .callsArgWith(
          1,
          null,
          `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
</CustomObject>`
        );

      stubMetadataCoverageReport();
    })
    .stdout()
    .stderr()
    .command(['mdcoverage:report', '--apiversion=43.0'])
    .it('should run successful with apiversion 43.0', () => {
      expect(process.exitCode).to.equal(0);
    });

  test
    .do(() => {
      $$.SANDBOX.stub(SfdxProject.prototype, 'getUniquePackageDirectories').returns([
        { name: 'force-app', path: 'force-app', fullPath: '' },
      ]);

      const stub = $$.SANDBOX.stub(recursivereaddir, 'recursiveReaddir') as unknown;
      const recursiveReaddirStub = stub as SinonStub<[string, RecursiveReaddirIgnores], Promise<string[]>>;

      recursiveReaddirStub
        .withArgs($$.SANDBOX.match.any, $$.SANDBOX.match.any)
        .rejects('recursiveReaddir NOT STUBBED for this arg')
        .withArgs('force-app', $$.SANDBOX.match.any)
        .resolves([
          'force-app/assignmentRules/Case.assignmentRules-meta.xml',
          'force-app/classes/ClsOne.cls-meta.xml',
          'force-app/objects/Account/fields/FldOne.field-meta.xml',
          'force-app/objects/ObjOne__c/ObjOne__c.object-meta.xml',
        ]);

      $$.SANDBOX.stub(fs, 'readFile')
        .callThrough()
        .withArgs('force-app/assignmentRules/Case.assignmentRules-meta.xml', $$.SANDBOX.match.any)
        .callsArgWith(
          1,
          null,
          `<?xml version="1.0" encoding="UTF-8"?>
<AssignmentRules xmlns="http://soap.sforce.com/2006/04/metadata"/>`
        )
        .withArgs('force-app/classes/ClsOne.cls-meta.xml', $$.SANDBOX.match.any)
        .callsArgWith(
          1,
          null,
          `<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="urn:metadata.tooling.soap.sforce.com" fqn="ClsOne">
</ApexClass>`
        )
        .withArgs('force-app/objects/Account/fields/FldOne.field-meta.xml', $$.SANDBOX.match.any)
        .callsArgWith(
          1,
          null,
          `<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
</CustomField>`
        )
        .withArgs('force-app/objects/ObjOne__c/ObjOne__c.object-meta.xml', $$.SANDBOX.match.any)
        .callsArgWith(
          1,
          null,
          `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
</CustomObject>`
        );

      stubMetadataCoverageReport();
    })
    .stdout()
    .stderr()
    .command(['mdcoverage:report', '-d', 'force-app'])
    .it('should run successful with sourcepath', () => {
      expect(process.exitCode).to.equal(0);
    });

  test
    .do(() => {
      $$.SANDBOX.stub(SfdxProject.prototype, 'getUniquePackageDirectories').returns([
        { name: 'force-app', path: 'force-app', fullPath: '' },
      ]);
      $$.SANDBOX.stub(SfdxProject.prototype, 'resolveProjectConfig').resolves({ sourceApiVersion: '50.0' });

      const stub = $$.SANDBOX.stub(recursivereaddir, 'recursiveReaddir') as unknown;
      const recursiveReaddirStub = stub as SinonStub<[string, RecursiveReaddirIgnores], Promise<string[]>>;

      recursiveReaddirStub
        .withArgs($$.SANDBOX.match.any, $$.SANDBOX.match.any)
        .rejects('recursiveReaddir NOT STUBBED for this arg')
        .withArgs('force-app', $$.SANDBOX.match.any)
        .resolves([
          'force-app/assignmentRules/Case.assignmentRules-meta.xml',
          'force-app/classes/ClsOne.cls-meta.xml',
          'force-app/objects/Account/fields/FldOne.field-meta.xml',
          'force-app/objects/ObjOne__c/ObjOne__c.object-meta.xml',
        ]);

      $$.SANDBOX.stub(fs, 'readFile')
        .callThrough()
        .withArgs('force-app/assignmentRules/Case.assignmentRules-meta.xml', $$.SANDBOX.match.any)
        .callsArgWith(
          1,
          null,
          `<?xml version="1.0" encoding="UTF-8"?>
<AssignmentRules xmlns="http://soap.sforce.com/2006/04/metadata"/>`
        )
        .withArgs('force-app/classes/ClsOne.cls-meta.xml', $$.SANDBOX.match.any)
        .callsArgWith(
          1,
          null,
          `<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="urn:metadata.tooling.soap.sforce.com" fqn="ClsOne">
</ApexClass>`
        )
        .withArgs('force-app/objects/Account/fields/FldOne.field-meta.xml', $$.SANDBOX.match.any)
        .callsArgWith(
          1,
          null,
          `<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
</CustomField>`
        )
        .withArgs('force-app/objects/ObjOne__c/ObjOne__c.object-meta.xml', $$.SANDBOX.match.any)
        .callsArgWith(
          1,
          null,
          `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
</CustomObject>`
        );

      stubMetadataCoverageReport();
    })
    .stdout()
    .stderr()
    .command(['mdcoverage:report'])
    .it('should run successful in project with sourceApiVersion', () => {
      expect(process.exitCode).to.equal(0);
    });

  describe('should fail', () => {
    // command should fail without SFDX project
    test
      .do(() => {
        $$.inProject(false);
      })
      .stdout()
      .stderr()
      .command(['mdcoverage:report'])
      .it('...without SFDX project', () => {
        expect(process.exitCode).to.equal(1);
      });

    // command should fail in SFDX project without package directories
    test
      .do(() => {
        $$.SANDBOX.stub(SfdxProject.prototype, 'getUniquePackageDirectories').returns([]);
      })
      .stdout()
      .stderr()
      .command(['mdcoverage:report'])
      .it('...in SFDX project without package directories', () => {
        expect(process.exitCode).to.equal(1);
      });

    // command should fail when package directory does not exist
    test
      .do(() => {
        $$.SANDBOX.stub(SfdxProject.prototype, 'getUniquePackageDirectories').returns([
          { name: 'force-app', path: 'force-app', fullPath: '' },
        ]);
      })
      .stdout()
      .stderr()
      .command(['mdcoverage:report'])
      .it('...when package directory does not exist', () => {
        expect(process.exitCode).to.equal(1);
      });
  });

  describe('should display', () => {
    const allKeys = [
      'metadataApi',
      'sourceTracking',
      'unlockedPackagingWithoutNamespace',
      'unlockedPackagingWithNamespace',
      'managedPackaging',
      'changeSets',
    ];

    function createExpectedMetadataFileCoverage(
      file: { path: string; fileName: string; folder: string; type: string },
      ...keys: string[]
    ): MetadataFileCoverage {
      keys = keys && keys.length ? keys : allKeys;

      const metadataFileCoverage = {
        file,
      };
      keys.forEach((key) => {
        const channelCoverage = MetadataCoverageReportApi52.types[file.type].channels[key];
        metadataFileCoverage[key] = channelCoverage;
      });

      return metadataFileCoverage;
    }

    test
      .do(() => {
        $$.SANDBOX.stub(SfdxProject.prototype, 'getUniquePackageDirectories').returns([
          { name: 'force-app', path: 'force-app', fullPath: '' },
        ]);

        const stub = $$.SANDBOX.stub(recursivereaddir, 'recursiveReaddir') as unknown;
        const recursiveReaddirStub = stub as SinonStub<[string, RecursiveReaddirIgnores], Promise<string[]>>;

        recursiveReaddirStub
          .withArgs($$.SANDBOX.match.any, $$.SANDBOX.match.any)
          .rejects('recursiveReaddir NOT STUBBED for this arg')
          .withArgs('force-app', $$.SANDBOX.match.any)
          .resolves([
            'force-app/assignmentRules/Case.assignmentRules-meta.xml',
            'force-app/classes/ClsOne.cls-meta.xml',
            'force-app/objects/Account/fields/FldOne.field-meta.xml',
            'force-app/objects/ObjOne__c/ObjOne__c.object-meta.xml',
          ]);

        $$.SANDBOX.stub(fs, 'readFile')
          .callThrough()
          .withArgs('force-app/assignmentRules/Case.assignmentRules-meta.xml', $$.SANDBOX.match.any)
          .callsArgWith(
            1,
            null,
            `<?xml version="1.0" encoding="UTF-8"?>
<AssignmentRules xmlns="http://soap.sforce.com/2006/04/metadata"/>`
          )
          .withArgs('force-app/classes/ClsOne.cls-meta.xml', $$.SANDBOX.match.any)
          .callsArgWith(
            1,
            null,
            `<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="urn:metadata.tooling.soap.sforce.com" fqn="ClsOne">
</ApexClass>`
          )
          .withArgs('force-app/objects/Account/fields/FldOne.field-meta.xml', $$.SANDBOX.match.any)
          .callsArgWith(
            1,
            null,
            `<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
</CustomField>`
          )
          .withArgs('force-app/objects/ObjOne__c/ObjOne__c.object-meta.xml', $$.SANDBOX.match.any)
          .callsArgWith(
            1,
            null,
            `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
</CustomObject>`
          );

        stubMetadataCoverageReport();
      })
      .stdout()
      .stderr()
      .command(['mdcoverage:report', '--json'])
      .it('...correct coverage report information', (ctx) => {
        expect(process.exitCode).to.equal(0);

        const expected = [
          createExpectedMetadataFileCoverage({
            fileName: 'Case.assignmentRules',
            folder: 'force-app/assignmentRules',
            path: 'force-app/assignmentRules/Case.assignmentRules-meta.xml',
            type: 'AssignmentRules',
          }),
          createExpectedMetadataFileCoverage({
            fileName: 'ClsOne.cls',
            folder: 'force-app/classes',
            path: 'force-app/classes/ClsOne.cls-meta.xml',
            type: 'ApexClass',
          }),
          createExpectedMetadataFileCoverage({
            fileName: 'FldOne.field',
            folder: 'force-app/objects/Account/fields',
            path: 'force-app/objects/Account/fields/FldOne.field-meta.xml',
            type: 'CustomField',
          }),
          createExpectedMetadataFileCoverage({
            fileName: 'ObjOne__c.object',
            folder: 'force-app/objects/ObjOne__c',
            path: 'force-app/objects/ObjOne__c/ObjOne__c.object-meta.xml',
            type: 'CustomObject',
          }),
        ];

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        const result = JSON.parse(ctx.stdout).result;

        expect(result).to.deep.equal(expected);
      });

    test
      .do(() => {
        $$.SANDBOX.stub(SfdxProject.prototype, 'getUniquePackageDirectories').returns([
          { name: 'force-app', path: 'force-app', fullPath: '' },
        ]);

        const stub = $$.SANDBOX.stub(recursivereaddir, 'recursiveReaddir') as unknown;
        const recursiveReaddirStub = stub as SinonStub<[string, RecursiveReaddirIgnores], Promise<string[]>>;

        recursiveReaddirStub
          .withArgs($$.SANDBOX.match.any, $$.SANDBOX.match.any)
          .rejects('recursiveReaddir NOT STUBBED for this arg')
          .withArgs('force-app', $$.SANDBOX.match.any)
          .resolves([
            'force-app/assignmentRules/Case.assignmentRules-meta.xml',
            'force-app/classes/ClsOne.cls-meta.xml',
            'force-app/objects/Account/fields/FldOne.field-meta.xml',
            'force-app/objects/ObjOne__c/ObjOne__c.object-meta.xml',
          ]);

        $$.SANDBOX.stub(fs, 'readFile')
          .callThrough()
          .withArgs('force-app/assignmentRules/Case.assignmentRules-meta.xml', $$.SANDBOX.match.any)
          .callsArgWith(
            1,
            null,
            `<?xml version="1.0" encoding="UTF-8"?>
  <AssignmentRules xmlns="http://soap.sforce.com/2006/04/metadata"/>`
          )
          .withArgs('force-app/classes/ClsOne.cls-meta.xml', $$.SANDBOX.match.any)
          .callsArgWith(
            1,
            null,
            `<?xml version="1.0" encoding="UTF-8"?>
  <ApexClass xmlns="urn:metadata.tooling.soap.sforce.com" fqn="ClsOne">
  </ApexClass>`
          )
          .withArgs('force-app/objects/Account/fields/FldOne.field-meta.xml', $$.SANDBOX.match.any)
          .callsArgWith(
            1,
            null,
            `<?xml version="1.0" encoding="UTF-8"?>
  <CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
  </CustomField>`
          )
          .withArgs('force-app/objects/ObjOne__c/ObjOne__c.object-meta.xml', $$.SANDBOX.match.any)
          .callsArgWith(
            1,
            null,
            `<?xml version="1.0" encoding="UTF-8"?>
  <CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
  </CustomObject>`
          );

        stubMetadataCoverageReport();
      })
      .stdout()
      .stderr()
      .command(['mdcoverage:report', '--checkmanagedpackaging', '--checkmetadataapi', '--json'])
      .it('...information about selected deployment channels', (ctx) => {
        expect(process.exitCode).to.equal(0);

        const expected = [
          createExpectedMetadataFileCoverage(
            {
              fileName: 'Case.assignmentRules',
              folder: 'force-app/assignmentRules',
              path: 'force-app/assignmentRules/Case.assignmentRules-meta.xml',
              type: 'AssignmentRules',
            },
            'metadataApi',
            'managedPackaging'
          ),
          createExpectedMetadataFileCoverage(
            {
              fileName: 'ClsOne.cls',
              folder: 'force-app/classes',
              path: 'force-app/classes/ClsOne.cls-meta.xml',
              type: 'ApexClass',
            },
            'metadataApi',
            'managedPackaging'
          ),
          createExpectedMetadataFileCoverage(
            {
              fileName: 'FldOne.field',
              folder: 'force-app/objects/Account/fields',
              path: 'force-app/objects/Account/fields/FldOne.field-meta.xml',
              type: 'CustomField',
            },
            'metadataApi',
            'managedPackaging'
          ),
          createExpectedMetadataFileCoverage(
            {
              fileName: 'ObjOne__c.object',
              folder: 'force-app/objects/ObjOne__c',
              path: 'force-app/objects/ObjOne__c/ObjOne__c.object-meta.xml',
              type: 'CustomObject',
            },
            'metadataApi',
            'managedPackaging'
          ),
        ];

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        const result = JSON.parse(ctx.stdout).result;

        expect(result).to.deep.equal(expected);
      });

    test
      .do(() => {
        $$.SANDBOX.stub(SfdxProject.prototype, 'getUniquePackageDirectories').returns([
          { name: 'force-app', path: 'force-app', fullPath: '' },
        ]);

        const stub = $$.SANDBOX.stub(recursivereaddir, 'recursiveReaddir') as unknown;
        const recursiveReaddirStub = stub as SinonStub<[string, RecursiveReaddirIgnores], Promise<string[]>>;

        recursiveReaddirStub
          .withArgs($$.SANDBOX.match.any, $$.SANDBOX.match.any)
          .rejects('recursiveReaddir NOT STUBBED for this arg')
          .withArgs('force-app', $$.SANDBOX.match.any)
          .resolves([
            'force-app/assignmentRules/Case.assignmentRules-meta.xml',
            'force-app/classes/ClsOne.cls-meta.xml',
            'force-app/objects/Account/fields/FldOne.field-meta.xml',
            'force-app/objects/ObjOne__c/ObjOne__c.object-meta.xml',
          ]);

        $$.SANDBOX.stub(fs, 'readFile')
          .callThrough()
          .withArgs('force-app/assignmentRules/Case.assignmentRules-meta.xml', $$.SANDBOX.match.any)
          .callsArgWith(
            1,
            null,
            `<?xml version="1.0" encoding="UTF-8"?>
    <AssignmentRules xmlns="http://soap.sforce.com/2006/04/metadata"/>`
          )
          .withArgs('force-app/classes/ClsOne.cls-meta.xml', $$.SANDBOX.match.any)
          .callsArgWith(
            1,
            null,
            `<?xml version="1.0" encoding="UTF-8"?>
    <ApexClass xmlns="urn:metadata.tooling.soap.sforce.com" fqn="ClsOne">
    </ApexClass>`
          )
          .withArgs('force-app/objects/Account/fields/FldOne.field-meta.xml', $$.SANDBOX.match.any)
          .callsArgWith(
            1,
            null,
            `<?xml version="1.0" encoding="UTF-8"?>
    <CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    </CustomField>`
          )
          .withArgs('force-app/objects/ObjOne__c/ObjOne__c.object-meta.xml', $$.SANDBOX.match.any)
          .callsArgWith(
            1,
            null,
            `<?xml version="1.0" encoding="UTF-8"?>
    <CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    </CustomObject>`
          );

        stubMetadataCoverageReport();
      })
      .stdout()
      .stderr()
      .command(['mdcoverage:report', '--checkmanagedpackaging', '--checkmetadataapi', '--showuncovered', '--json'])
      .it('...information about uncovered metadata files only', (ctx) => {
        expect(process.exitCode).to.equal(0);

        const expected = [
          createExpectedMetadataFileCoverage(
            {
              fileName: 'Case.assignmentRules',
              folder: 'force-app/assignmentRules',
              path: 'force-app/assignmentRules/Case.assignmentRules-meta.xml',
              type: 'AssignmentRules',
            },
            'metadataApi',
            'managedPackaging'
          ),
        ];

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        const result = JSON.parse(ctx.stdout).result;

        expect(result).to.deep.equal(expected);
      });
  });
});
