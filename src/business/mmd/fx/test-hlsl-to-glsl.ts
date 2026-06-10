/**
 * HLSL到GLSL转换测试脚本
 * 测试FXParser的GLSL转换功能
 */

import { FXParser } from './FXParser';
import { HLSLToGLSLConverter } from './HLSLToGLSLConverter';

/**
 * 测试基础类型转换
 */
function testBasicConversion() {
  console.log('\n🧪 测试基础类型转换\n' + '='.repeat(60));
  
  const converter = new HLSLToGLSLConverter();
  const hlslCode = `
    float4 myColor = float4(1.0, 0.5, 0.3, 1.0);
    float3 myNormal = float3(0.0, 1.0, 0.0);
    float2 myUV = float2(0.5, 0.5);
    matrix myMatrix = float4x4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  `;
  
  const result = converter.convert(hlslCode, 'vertex');
  console.log('输入 (HLSL):');
  console.log(hlslCode);
  console.log('\n输出 (GLSL):');
  console.log(result.glslCode);
}

/**
 * 测试函数转换
 */
function testFunctionConversion() {
  console.log('\n🧪 测试函数转换\n' + '='.repeat(60));
  
  const converter = new HLSLToGLSLConverter();
  const hlslCode = `
    float4 color = tex2D(sampler, uv);
    float3 blended = lerp(color1, color2, factor);
    float clamped = saturate(value);
    float fractional = frac(value);
  `;
  
  const result = converter.convert(hlslCode, 'fragment');
  console.log('输入 (HLSL):');
  console.log(hlslCode);
  console.log('\n输出 (GLSL):');
  console.log(result.glslCode);
}

/**
 * 测试完整的shader函数
 */
function testCompleteShader() {
  console.log('\n🧪 测试完整shader转换\n' + '='.repeat(60));
  
  const converter = new HLSLToGLSLConverter();
  const hlslVertexShader = `
float4 VS_Main(
  float4 pos : POSITION,
  float3 normal : NORMAL,
  float2 texcoord : TEXCOORD0
) : SV_POSITION {
  float4 worldPos = mul(worldMatrix, pos);
  float4 viewPos = mul(viewMatrix, worldPos);
  float4 projPos = mul(projectionMatrix, viewPos);
  return projPos;
}
  `;
  
  const result = converter.convert(hlslVertexShader, 'vertex');
  console.log('输入 (HLSL Vertex Shader):');
  console.log(hlslVertexShader);
  console.log('\n输出 (GLSL Vertex Shader):');
  console.log(result.glslCode);
  console.log('\nDetected Attributes:', result.attributes);
  console.log('Detected Uniforms:', result.uniforms);
}

/**
 * 测试从FX文件转换
 */
async function testFXFileConversion() {
  console.log('\n🧪 测试FX文件转换\n' + '='.repeat(60));
  
  try {
    // 模拟一个简单的FX内容
    const simpleFXContent = `
// Simple test effect
float4x4 WorldViewProj : WORLDVIEWPROJECTION;
sampler2D DiffuseSampler;

struct VS_INPUT {
  float4 Position : POSITION;
  float2 TexCoord : TEXCOORD0;
};

struct VS_OUTPUT {
  float4 Position : SV_POSITION;
  float2 TexCoord : TEXCOORD0;
};

VS_OUTPUT VS_Main(VS_INPUT input) {
  VS_OUTPUT output;
  output.Position = mul(WorldViewProj, input.Position);
  output.TexCoord = input.TexCoord;
  return output;
}

float4 PS_Main(VS_OUTPUT input) : SV_TARGET {
  float4 color = tex2D(DiffuseSampler, input.TexCoord);
  return saturate(color);
}

technique MainTechnique {
  pass P0 {
    VertexShader = compile vs_3_0 VS_Main();
    PixelShader = compile ps_3_0 PS_Main();
  }
}
`;
    
    // 使用启用GLSL转换的解析器
    const parser = new FXParser({
      convertToGLSL: true,
      vertexShaderFunction: 'VS_Main',
      fragmentShaderFunction: 'PS_Main',
    });
    
    const effect = parser.parse(simpleFXContent, 'test.fx');
    
    console.log('FX文件解析结果:');
    console.log('  - Defines:', effect.defines.length);
    console.log('  - Parameters:', effect.parameters.length);
    console.log('  - Techniques:', effect.techniques.length);
    console.log('  - Shader Functions:', effect.shaderFunctions.length);
    
    if (effect.glslShaders) {
      console.log('\n✅ GLSL转换成功!');
      console.log('\nVertex Shader (GLSL):');
      console.log(effect.glslShaders.vertexShader?.code || '未转换');
      console.log('\nFragment Shader (GLSL):');
      console.log(effect.glslShaders.fragmentShader?.code || '未转换');
      
      if (effect.glslShaders.warnings.length > 0) {
        console.log('\n⚠️ 转换警告:');
        effect.glslShaders.warnings.forEach(w => console.log('  -', w));
      }
    } else {
      console.log('\n❌ GLSL转换失败');
    }
    
  } catch (error) {
    console.error('测试出错:', error);
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('\n🚀 HLSL到GLSL转换器测试');
  console.log('='.repeat(60));
  
  testBasicConversion();
  testFunctionConversion();
  testCompleteShader();
  await testFXFileConversion();
  
  console.log('\n✨ 所有测试完成！');
  console.log('='.repeat(60));
}

// 运行测试
runAllTests().catch(console.error);

