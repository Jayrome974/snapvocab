import cdk = require('@aws-cdk/core');
import s3 = require('@aws-cdk/aws-s3');
import s3deploy = require("@aws-cdk/aws-s3-deployment")
import route53 = require("@aws-cdk/aws-route53")
import targets = require("@aws-cdk/aws-route53-targets/lib")
import acm = require("@aws-cdk/aws-certificatemanager")
import cloudfront = require("@aws-cdk/aws-cloudfront")
import path = require('path')


export interface SnapVocabProps extends cdk.StackProps {
  domainName: string
}

export class SnapvocabStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: SnapVocabProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const zone = route53.HostedZone.fromLookup(this, "Zone", {
      domainName: props.domainName,
    })
    new cdk.CfnOutput(this, "Site", {
      value: "https://" + props.domainName
    })

    // Content bucket
    const siteBucket = new s3.Bucket(this, "SiteBucket", {
      bucketName: props.domainName,
      websiteIndexDocument: "index.html",
      publicReadAccess: true,

      // The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
      // the new bucket, and it will remain in your account until manually deleted. By setting the policy to
      // DESTROY, cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.
      // NOT recommended for production code
      // removalPolicy: cdk.RemovalPolicy.DESTROY, 
      // autoDeleteObjects: true
    })
    new cdk.CfnOutput(this, "Bucket", { value: siteBucket.bucketName })

    // TLS certificate
    const certificateArn = new acm.DnsValidatedCertificate(this, "SiteCertificate", {
        domainName: props.domainName,
        hostedZone: zone,
        region: "us-east-1", // Cloudfront only checks this region for certificates.
      }
    ).certificateArn
    new cdk.CfnOutput(this, "Certificate", { value: certificateArn })

    // CloudFront distribution that provides HTTPS
    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "SiteDistribution",
      {
        aliasConfiguration: {
          acmCertRef: certificateArn,
          names: [props.domainName],
          sslMethod: cloudfront.SSLMethod.SNI,
          securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_1_2016,
        },
        originConfigs: [
          {
            customOriginSource: {
              domainName: siteBucket.bucketWebsiteDomainName,
              originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
      }
    )
    new cdk.CfnOutput(this, "DistributionId", {
      value: distribution.distributionId,
    })

    // Route53 alias record for the CloudFront distribution
    new route53.ARecord(this, "SiteAliasRecord", {
      recordName: props.domainName,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
      zone,
    })

    // Deploy site contents to S3 bucket
    new s3deploy.BucketDeployment(this, "DeployWithInvalidation", {
      sources: [s3deploy.Source.asset(path.resolve(__dirname, '../../hanzi_ui_vue/dist'))],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ["/*"],
    })
  }
}
