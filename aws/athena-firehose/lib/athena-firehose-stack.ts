import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as firehose from "@aws-cdk/aws-kinesisfirehose-alpha";
import * as destinations from "@aws-cdk/aws-kinesisfirehose-destinations-alpha";
import * as glue from "@aws-cdk/aws-glue-alpha";
import { CfnTable, CfnDatabase } from "aws-cdk-lib/aws-glue";
import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";

export class AthenaFirehoseStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "SampleApp1 Bucket", {
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const db = new glue.Database(this, "SampleApp1 DB", {
      databaseName: "sample_app1",
    });

    createTableAndStream(this, db, bucket, "2022/07/03", "login_request", [
      {
        name: "login_timestamp",
        type: glue.Schema.TIMESTAMP,
      },
      {
        name: "user_id",
        type: glue.Schema.STRING,
      },
    ]);
  }
}

function createTableAndStream(
  scope: Construct,
  db: glue.Database,
  bucket: s3.Bucket,
  dateRangeStart: string,
  name: string,
  columns: glue.Column[]
) {
  const table = new glue.Table(scope, `Table-${name}`, {
    database: db,
    dataFormat: glue.DataFormat.PARQUET,
    tableName: name,
    bucket,
    s3Prefix: `data/${name}/`,
    partitionKeys: [
      {
        name: "logged_date",
        type: glue.Schema.STRING,
      },
    ],
    columns,
  });
  (table.node.defaultChild as any).tableInput.parameters = {
    "projection.enabled": true,
    "projection.logged_date.type": "date",
    "projection.logged_date.range": `${dateRangeStart},NOW`,
    "projection.logged_date.format": "yyyy/MM/dd",
    "projection.logged_date.interval": 1,
    "projection.logged_date.interval.unit": "DAYS",
    "storage.location.template":
      `s3://${bucket.bucketName}/data/${name}/` + "${logged_date}",
  };

  const role = new Role(scope, `Stream Glue Access Role ${name}`, {
    assumedBy: new ServicePrincipal("firehose.amazonaws.com"),
  });
  table.grantRead(role);
  table.grantToUnderlyingResources(role, [
    "glue:BatchGetPartition",
    "glue:GetPartition",
    "glue:GetPartitions",
    "glue:GetTable",
    "glue:GetTableVersion",
    "glue:GetTableVersions",
    "glue:GetTables",
  ]);

  const dest = new ExtendedS3Bucket(bucket, {
    dataOutputPrefix: `data/${name}/!{timestamp:yyyy/MM/dd}/`,
    errorOutputPrefix: `firehose_error/${name}/!{timestamp:yyyy/MM/dd}/!{firehose:error-output-type}-`,
  });
  dest.setExAttrs(db, table, role);

  const stream = new firehose.DeliveryStream(scope, `Delivery Stream ${name}`, {
    deliveryStreamName: `${db.databaseName}-${name}`,
    destinations: [dest],
  });
}

class ExtendedS3Bucket extends destinations.S3Bucket {
  exAttrs: {
    db: glue.Database;
    table: glue.Table;
    role: iam.Role;
  };

  setExAttrs(db: glue.Database, table: glue.Table, role: iam.Role) {
    this.exAttrs = { db, table, role };
  }

  bind(
    scope: Construct,
    _options: firehose.DestinationBindOptions
  ): firehose.DestinationConfig {
    const baseConfig = super.bind(scope, _options);

    const config: firehose.DestinationConfig = {
      dependables: baseConfig.dependables,
      extendedS3DestinationConfiguration: {
        ...baseConfig.extendedS3DestinationConfiguration!,
        ...{
          dataFormatConversionConfiguration: {
            schemaConfiguration: {
              databaseName: (this.exAttrs.db.node.defaultChild as CfnDatabase)
                .ref,
              tableName: (this.exAttrs.table.node.defaultChild as CfnTable).ref,
              roleArn: (this.exAttrs.role.node.defaultChild as iam.CfnRole)
                .getAtt("Arn")
                .toString(),
            },
            inputFormatConfiguration: {
              deserializer: { openXJsonSerDe: {} },
            },
            outputFormatConfiguration: {
              serializer: { parquetSerDe: { compression: "SNAPPY" } },
            },
          },
        },
      },
    };

    return config;
  }
}
