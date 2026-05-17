import struct

def get_mp4_video_resolution(file_path):
    try:
        with open(file_path, 'rb') as f:
            data = f.read(10000)
            # Find 'tkhd' atom (track header)
            tkhd_idx = data.find(b'tkhd')
            if tkhd_idx != -1:
                # The width and height are at offset 76 and 80 from tkhd start in version 0, 
                # or offset 88 and 92 in version 1. Let's inspect version.
                version = data[tkhd_idx + 4]
                if version == 0:
                    width_offset = tkhd_idx + 80
                    height_offset = tkhd_idx + 84
                else:
                    width_offset = tkhd_idx + 92
                    height_offset = tkhd_idx + 96
                
                width_fixed = struct.unpack('>I', data[width_offset:width_offset+4])[0]
                height_fixed = struct.unpack('>I', data[height_offset:height_offset+4])[0]
                
                # Fixed-point 16.16 decimal
                width = width_fixed >> 16
                height = height_fixed >> 16
                return width, height
    except Exception as e:
        return str(e)
    return None

print("hero.mp4:", get_mp4_video_resolution('video/hero.mp4'))
print("hero1.mp4:", get_mp4_video_resolution('video/hero1.mp4'))
