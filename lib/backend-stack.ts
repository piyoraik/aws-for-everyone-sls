import { Cors, LambdaIntegration, RestApi } from "@aws-cdk/aws-apigateway";
import { AttributeType, BillingMode, Table } from "@aws-cdk/aws-dynamodb";
import { Code, Function, Runtime } from "@aws-cdk/aws-lambda";
import { LogRetention, RetentionDays } from "@aws-cdk/aws-logs";
import { StringParameter } from "@aws-cdk/aws-ssm";
import { Construct, Stack, StackProps } from "@aws-cdk/core";
import HTTPMethod from "http-method-enum";

export class BackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // API Gatewayの作成
    const api = new RestApi(this, 'RestApi', {
      restApiName: 'BackendApi',
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowCredentials: true,
        allowMethods: Cors.ALL_METHODS,
      }
    });

    // DynamoDBの作成
    const personsTable = new Table(this, 'PersonsTable', {
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'Id', type: AttributeType.STRING }
    });

    // Lambda関数の作成
    const personFunc = new Function(this, 'PersonsFunc', {
      code: Code.fromAsset('./src/backend/persons'),
      handler: 'persons',
      runtime: Runtime.GO_1_X,
      environment: {
        'TABLE_NAME': personsTable.tableName
      },
      logRetention: RetentionDays.TWO_WEEKS,
    });
    personsTable.grantReadData(personFunc);
    const personsInteg = new LambdaIntegration(personFunc)


    // API GatewayとLambdaの関連付け
    const personsPath = api.root.addResource('persons');
    const personIdPath = personsPath.addResource('{personId}');
    personsPath.addMethod(HTTPMethod.GET, personsInteg);
    personsPath.addMethod(HTTPMethod.POST, personsInteg);
    personsPath.addMethod(HTTPMethod.DELETE, personsInteg);

    // SSM Parameter StoreにAPIのURLをエクスポート
    new StringParameter(this, 'ApiUrlParam', {
      parameterName: `/${this.stackName}/ApiUrl`,
      stringValue: api.url
    });
  }
}