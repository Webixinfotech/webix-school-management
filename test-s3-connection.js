require('dotenv').config();
const { S3Client, ListBucketsCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');

async function testS3Connection() {
  console.log('\n🔍 Testing S3 Connection...\n');
  
  // Log configuration
  console.log('📋 Configuration:');
  console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID);
  console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY?.substring(0, 10) + '...');
  console.log('AWS_S3_BUCKET_NAME:', process.env.AWS_S3_BUCKET_NAME);
  console.log('AWS_S3_REGION:', process.env.AWS_S3_REGION);
  console.log('');

  try {
    // Initialize S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },
      maxAttempts: 3
    });

    // Test 1: List buckets to verify credentials
    console.log('✅ Test 1: Listing all buckets...');
    const listCommand = new ListBucketsCommand({});
    const listResponse = await s3Client.send(listCommand);
    
    console.log(`📦 Found ${listResponse.Buckets?.length || 0} buckets:`);
    listResponse.Buckets?.forEach(bucket => {
      console.log(`   - ${bucket.Name} (${bucket.CreationDate})`);
    });
    console.log('');

    // Test 2: Check if target bucket exists and is accessible
    const targetBucket = process.env.AWS_S3_BUCKET_NAME;
    console.log(`✅ Test 2: Checking bucket "${targetBucket}"...`);
    
    try {
      const headCommand = new HeadBucketCommand({
        Bucket: targetBucket
      });
      await s3Client.send(headCommand);
      console.log(`✅ Bucket "${targetBucket}" is accessible!`);
      console.log('');

      // Test 3: Try to upload a test file
      console.log('✅ Test 3: Uploading test file...');
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      
      const testContent = Buffer.from('Test upload from BrainBuilder');
      const testKey = 'test/connection-test.txt';
      
      const putCommand = new PutObjectCommand({
        Bucket: targetBucket,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain'
      });
      
      await s3Client.send(putCommand);
      console.log(`✅ Test file uploaded successfully!`);
      console.log(`📁 File URL: https://${targetBucket}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${testKey}`);
      console.log('');
      
      // Cleanup test file
      console.log('🗑️  Cleaning up test file...');
      const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
      const deleteCommand = new DeleteObjectCommand({
        Bucket: targetBucket,
        Key: testKey
      });
      await s3Client.send(deleteCommand);
      console.log('✅ Test file deleted!');
      
      console.log('\n🎉 All tests passed! S3 is configured correctly.\n');
      
    } catch (error) {
      console.error(`❌ Bucket "${targetBucket}" error:`, error.name);
      console.error('Message:', error.message);
      console.log('');
      console.log('💡 Possible causes:');
      console.log('   1. Bucket does not exist');
      console.log('   2. Bucket is in a different region');
      console.log('   3. IAM user lacks permissions');
      console.log('   4. Bucket policy blocks access');
    }
    
  } catch (error) {
    console.error('❌ S3 Connection failed:', error.message);
    console.log('');
    console.log('💡 Check your AWS credentials and region.');
  }
}

// Run test
testS3Connection().catch(console.error);
