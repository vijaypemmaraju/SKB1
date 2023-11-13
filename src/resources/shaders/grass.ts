import glsl from "../../utils/glsl";

const grass = glsl`
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform sampler2D gradient;
uniform sampler2D tex;
uniform sampler2D noise_tex;
uniform sampler2D cloud_tex;
uniform float wind_speed;
uniform vec2 wind_direction;
uniform vec4 tip_color;
uniform vec4 wind_color;
uniform vec2 noise_tex_size;
uniform vec2 camera_position;
uniform float camera_zoom;

varying vec2 fragCoord;

const int firstOctave = 3;
const int octaves = 8;
const float persistence = 0.6;

#define PI 3.1415926535
#define MAX_BLADE_LENGTH 10.0

float sineWave(float T, float a, float phase, vec2 dir, vec2 pos) {
    return a * sin(2.0 * PI / T * dot(dir, pos) + phase);
}

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

vec4 sampleColor(float dist) {
  vec2 value = vec2(dist + 0.5, 0.0) / 3.0;
  return texture2D(gradient, value);
}

float sampleBladeLength(vec2 uv) {
    return texture2D(tex, uv).r * MAX_BLADE_LENGTH;
}

float sampleNoise(float value, vec2 texture_pixel_size, float offset) {
  float valueX = value / texture_pixel_size.x / noise_tex_size.x + offset;
  // wrap value between 0 and 1
  valueX = fract(valueX);
  valueX = floor(valueX * 100.0) / 100.0;
	return texture2D(noise_tex, vec2(valueX, 0.0)).r * 2.0;
}

float wind (vec2 pos, float t, float pnoise) {
	return pnoise * (sineWave(200.0, 5.8, 4.0*wind_speed*t, normalize(wind_direction), pos)
		   + sineWave(75.0, 2.1, 1.0*wind_speed*t, normalize(wind_direction - vec2(0.0, 0.4)), pos)
		   + sineWave(70.0, 1.1, 0.5*wind_speed*t, normalize(wind_direction + vec2(0.4, 0.0)), pos))
		   / 3.0;
}

void main() {
  vec2 UV = fragCoord / resolution;
  UV.y = 1.0 - UV.y;
    // First, sample some 1D noise
  vec2 SCREEN_PIXEL_SIZE = vec2(1.0 / resolution.x, 1.0 / resolution.y);
	float noise = sampleNoise(fragCoord.x, SCREEN_PIXEL_SIZE, 4.0 * wind_speed * time);
	float noiseY = sampleNoise(fragCoord.y, SCREEN_PIXEL_SIZE, 4.0 * wind_speed * time);
	// Add the nose to the uv for frayed grass
	vec2 uv = UV - vec2(0.0, noise / resolution);
  vec2 downscaled_resolution = vec2(resolution.x / 1., resolution.y / 1.);

  vec4 COLOR = vec4(0.0, 0.0, 0.0, 0.0);

	// Color the base of the grass with the first gradient color
	if (texture2D(tex, UV).r > 0.0) {
		COLOR = sampleColor(0.0);
		// COLOR -= vec4(texture2D(cloud_tex, UV).rgb, 0.0);
	} else {
		COLOR = vec4(0.0, 0.0, 0.0, 0.0);
	}

  float uvWorldPosX = (uv.x) + camera_position.x / resolution.x;
  float uvWorldPosY = (uv.y) + camera_position.y / resolution.y;
  uvWorldPosX = floor(uvWorldPosX * downscaled_resolution.x) / downscaled_resolution.x;
  uvWorldPosY = floor(uvWorldPosY * downscaled_resolution.y) / downscaled_resolution.y;

  float pnoise = PerlinNoise2D(uvWorldPosX * 1000.0, uvWorldPosY * 1000.0) * 40.0 + PerlinNoise2D(uvWorldPosX * 100.0, uvWorldPosY * 100.0) * 20.0 + PerlinNoise2D(uvWorldPosX * 10.0, uvWorldPosY * 10.0) * 10.0;

	for (float dist = 0.0; dist < MAX_BLADE_LENGTH; ++dist) {
		// Sample the wind
		float wind = pnoise;

		// Get the height of the balde originating at the current pixel
		// (0 means no blade)
		float blade_length = sampleBladeLength(uv);

		if (blade_length > 0.0) {
			// Blades are pressed down by the wind
			if (wind > 0.5) {
				blade_length -= 2.0;
			}

			// Color basec on distance from root
			if (abs(dist - blade_length) < 1.0) {
				// Color grass tips
				if (wind <= 0.5) {
          COLOR = tip_color.xyzw  + vec4(pnoise, pnoise, pnoise, 1.0) * PerlinNoise2D(uvWorldPosX * 100.0, uvWorldPosY * 100.0) * 0.1;
				} else  {
					COLOR = wind_color.xyzw  + vec4(pnoise, pnoise, pnoise, 1.0) * PerlinNoise2D(uvWorldPosX * 100.0, uvWorldPosY * 100.0) * 0.1;
				}

				// Add the cloud shadow
				// COLOR -= vec4(texture2D(cloud_tex, uv).rgb, 0.0);
				break;
			} else if (dist < blade_length) {
				// Color grass stems
				COLOR = sampleColor(dist);

				// Add the cloud shadow
				// COLOR -= vec4(texture2D(cloud_tex, uv).rgb, 0.0);
			}
		}

		// Move on to the next pixel, down the blades
		uv += vec2(0.0, SCREEN_PIXEL_SIZE.y);
	}


  // gl_FragColor = vec4(pnoise, pnoise, pnoise, 1.0);
  gl_FragColor = COLOR;
}`;

export default grass;
