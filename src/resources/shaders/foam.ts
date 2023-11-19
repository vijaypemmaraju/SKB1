import glsl from "../../utils/glsl";

const foam = glsl`
#ifdef GL_ES
precision mediump float;
#endif


// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

uniform sampler2D tex;
uniform vec2 camera_position;
uniform float camera_zoom;

varying vec2 fragCoord;

// shadertoy globals
#define iTime time
#define iResolution resolution


const int firstOctave = 3;
const int octaves = 8;
const float persistence = 0.6;

#define PI 3.1415926535

float noise(int x,int y)
{
    float fx = float(x);
    float fy = float(y);

    return 2.0 * fract(sin(dot(vec2(fx, fy) ,vec2(12.9898,78.233))) * 43758.5453) - 1.0;
}

float smoothNoise(int x,int y)
{
    return noise(x,y)/4.0+(noise(x+1,y)+noise(x-1,y)+noise(x,y+1)+noise(x,y-1))/8.0+(noise(x+1,y+1)+noise(x+1,y-1)+noise(x-1,y+1)+noise(x-1,y-1))/16.0;
}


float COSInterpolation(float x,float y,float n)
{
    float r = n*PI;
    float f = (1.0-cos(r))*0.5;
    return x*(1.0-f)+y*f;

}

float InterpolationNoise(float x, float y)
{
    int ix = int(x);
    int iy = int(y);
    float fracx = x-float(int(x));
    float fracy = y-float(int(y));

    float v1 = smoothNoise(ix,iy);
    float v2 = smoothNoise(ix+1,iy);
    float v3 = smoothNoise(ix,iy+1);
    float v4 = smoothNoise(ix+1,iy+1);

   	float i1 = COSInterpolation(v1,v2,fracx);
    float i2 = COSInterpolation(v3,v4,fracx);

    return COSInterpolation(i1,i2,fracy);

}

float PerlinNoise2D(float x,float y)
{
    float sum = 0.0;
    float frequency =0.0;
    float amplitude = 0.0;
    for(int i=firstOctave;i<octaves + firstOctave;i++)
    {
        frequency = pow(2.0,float(i)) + time / 1000.0;
        amplitude = pow(persistence,float(i)) + sin(time / 1000.0) * 0.1;
        sum = sum + InterpolationNoise(x*frequency,y*frequency)*amplitude;
    }

    return sum;
}

void main()
{
    vec2 screenUv = fragCoord / resolution;
    screenUv.y = 1.0 - screenUv.y;
    vec4 texColor = texture2D(tex, screenUv);

    float size = 2. ;// sin(time / 1000.) * 2. + 2.;

    for (int i = 0; i <= 4; i++) {
        if (float(i) >= size) {
            break;
        }
        for (int j = 0; j <= 4; j++) {
            if (float(j) >= size) {
                break;
            }
            // blend nearby pixels
            vec2 uv = screenUv + vec2(float(i) - float(size) / 2., float(j) - float(size) / 2.) * 1.0 / resolution;
            float noise = 0. ;//PerlinNoise2D(uv.x * 1., uv.y * 1.);
            uv = uv + vec2(noise, noise) * sin(time / 1000.0) * 1.;
            texColor += texture2D(tex, uv);
        }
    }

    // texColor /= 25.0;


    gl_FragColor = vec4(texColor.a, texColor.a, texColor.a, texColor.a);
}
`;

export default foam;
