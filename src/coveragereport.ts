import fetch from 'node-fetch';

export type MetadataTypeCoverageChannels = {
  [key: string]: boolean;
  unlockedPackagingWithoutNamespace: boolean;
  unlockedPackagingWithNamespace: boolean;
  toolingApi: boolean;
  sourceTracking: boolean;
  metadataApi: boolean;
  managedPackaging: boolean;
  classicUnmanagedPackaging: boolean;
  classicManagedPackaging: boolean;
  changeSets: boolean;
  apexMetadataApi: boolean;
};

export type MetadataTypeCoverage = {
  channels: MetadataTypeCoverageChannels;
};

export type MetadataCoverageReport = {
  [type: string]: MetadataTypeCoverage;
};

type MetadataCoverageReportVersions = {
  selected: number;
  max: number;
  min: number;
};

type MetadataCoverageReportResponse = {
  types: MetadataCoverageReport;
  versions: MetadataCoverageReportVersions;
};

const DEFAULT_API_VERSION = '51';

export default async function fetchMetadataCoverageReport(
  apiVersion: string = DEFAULT_API_VERSION
): Promise<MetadataCoverageReport> {
  const mdApiVersion = apiVersion.includes('.') ? apiVersion.substring(0, apiVersion.indexOf('.')) : apiVersion;
  const mdCoverageReportUri = `https://mdcoverage.secure.force.com/services/apexrest/report?version=${mdApiVersion}`;
  const requestOptions = { method: 'Get' };

  return new Promise((resolve, reject) => {
    fetch(mdCoverageReportUri, requestOptions)
      .then((response) => response.json() as Promise<MetadataCoverageReportResponse>)
      .then((mdCoverageReportResponse) => {
        resolve(mdCoverageReportResponse.types);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
