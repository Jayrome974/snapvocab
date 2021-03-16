import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as Snapvocab from '../lib/snapvocab-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Snapvocab.SnapvocabStack(app, 'SnapvocabStack', {
      env: {
        account: app.node.tryGetContext("account"),
        region: app.node.tryGetContext("region"),
      },
      domainName: "domainname.com"
    });
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
