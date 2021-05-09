import { expect } from 'chai';
import fetch from 'node-fetch';
import fetchMetadataCoverageReport from '../src/coveragereport';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-var-requires
const sandbox = require('sinon').createSandbox();

describe('fetchMetadataCoverageReport', function () {
  afterEach(function () {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    sandbox.restore();
  });

  describe('should return metadata coverage report data', function () {
    beforeEach(function () {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      sandbox.stub(fetch, 'Promise').returns(
        Promise.resolve({
          json: () =>
            new Promise((resolve) => {
              resolve({
                types: {
                  ApexClass: {
                    channels: {
                      unlockedPackagingWithoutNamespace: true,
                      unlockedPackagingWithNamespace: true,
                      toolingApi: true,
                      sourceTracking: true,
                      metadataApi: true,
                      managedPackaging: true,
                      classicUnmanagedPackaging: true,
                      classicManagedPackaging: true,
                      changeSets: true,
                      apexMetadataApi: false,
                    },
                  },
                  AssignmentRules: {
                    channels: {
                      unlockedPackagingWithoutNamespace: false,
                      unlockedPackagingWithNamespace: false,
                      toolingApi: true,
                      sourceTracking: true,
                      metadataApi: true,
                      managedPackaging: false,
                      classicUnmanagedPackaging: false,
                      classicManagedPackaging: false,
                      changeSets: true,
                      apexMetadataApi: false,
                    },
                  },
                },
                versions: {
                  selected: 51,
                  max: 52,
                  min: 43,
                },
              });
            }),
        })
      );
    });

    const expected = {
      ApexClass: {
        channels: {
          metadataApi: true,
          sourceTracking: true,
          unlockedPackagingWithoutNamespace: true,
          unlockedPackagingWithNamespace: true,
          managedPackaging: true,
          classicUnmanagedPackaging: true,
          classicManagedPackaging: true,
          changeSets: true,
          apexMetadataApi: false,
          toolingApi: true,
        },
      },
      AssignmentRules: {
        channels: {
          metadataApi: true,
          sourceTracking: true,
          unlockedPackagingWithoutNamespace: false,
          unlockedPackagingWithNamespace: false,
          managedPackaging: false,
          classicUnmanagedPackaging: false,
          classicManagedPackaging: false,
          changeSets: true,
          apexMetadataApi: false,
          toolingApi: true,
        },
      },
    };

    it('with default API version', async function () {
      const mdCoverageReportWithDefaultApiVersion = await fetchMetadataCoverageReport();
      expect(mdCoverageReportWithDefaultApiVersion).to.deep.eq(expected);
    });
    it('with API version 43', async function () {
      const mdCoverageReportWithDefaultApiVersion = await fetchMetadataCoverageReport('43');
      expect(mdCoverageReportWithDefaultApiVersion).to.deep.eq(expected);
    });
    it('with API version 43.0', async function () {
      const mdCoverageReportWithDefaultApiVersion = await fetchMetadataCoverageReport('43.0');
      expect(mdCoverageReportWithDefaultApiVersion).to.deep.eq(expected);
    });
    it('with API version 52', async function () {
      const mdCoverageReportWithDefaultApiVersion = await fetchMetadataCoverageReport('52');
      expect(mdCoverageReportWithDefaultApiVersion).to.deep.eq(expected);
    });
  });

  it('should fail in case of no response', async function () {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    sandbox.stub(fetch, 'Promise').returns(Promise.reject(new Error('Call has failed')));

    const expectedError = 'Call has failed';

    let error: string = null;
    try {
      await fetchMetadataCoverageReport();
    } catch (ex: unknown) {
      error = (ex as Error).message;
    }
    expect(error).to.be.eq(expectedError);
  });

  it('should fail for illegal API version v43.0', async function () {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    sandbox.stub(fetch, 'Promise').returns(Promise.reject(new Error('Invalid integer')));

    const expectedError = 'Invalid integer';

    let error: string = null;
    try {
      await fetchMetadataCoverageReport('v43.0');
    } catch (ex: unknown) {
      error = (ex as Error).message;
    }
    expect(error).to.be.eq(expectedError);
  });
});
