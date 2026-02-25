shader_type canvas_item;

// Main texture (automatically provided by Godot for canvas_item)
uniform sampler2D noise_texture : filter_linear, repeat_enable;
uniform vec2 speed = vec2(0.5, 0.3);
uniform float distortion_strength : hint_range(0.0, 0.1) = 0.02;
uniform vec2 offset = vec2(0.0, 0.0);

void fragment() {
    // Calculate animated UV coordinates for noise sampling
    vec2 noise_uv = UV + offset + speed * TIME;

    // Sample the noise texture
    vec4 noise_sample = texture(noise_texture, noise_uv);

    // Convert noise from [0,1] to [-1,1] range for distortion
    vec2 distortion = (noise_sample.rg - 0.5) * 2.0 * distortion_strength;

    // Apply distortion to original UV coordinates
    vec2 distorted_uv = UV + distortion;

    // Sample the main texture with distorted UV
    COLOR = texture(TEXTURE, distorted_uv);
}