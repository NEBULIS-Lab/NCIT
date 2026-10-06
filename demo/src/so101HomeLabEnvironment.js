/** Fixed visual environment for the expanded SO101 Home Lab scene. */
export const SO101_HOME_LAB_ROOM_XML = `
    <!-- Architectural shell: three walls, with the south side open for the camera. -->
    <body name="home_lab_room_back_wall" pos="0 4.16 1.35">
      <geom name="home_lab_room_back_wall_panel" type="box" size="4.92 0.04 1.35" rgba="0.78 0.76 0.70 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_room_back_wall_baseboard" type="box" pos="0 -0.045 -1.25" size="4.88 0.025 0.10" rgba="0.54 0.50 0.44 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_room_back_wall_crown" type="box" pos="0 -0.045 1.25" size="4.88 0.025 0.055" rgba="0.86 0.84 0.79 1" contype="0" conaffinity="0"/>
    </body>
    <body name="home_lab_room_west_wall" pos="-4.96 0 1.35">
      <geom name="home_lab_room_west_wall_panel" type="box" size="0.04 4.12 1.35" rgba="0.76 0.75 0.70 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_room_west_wall_baseboard" type="box" pos="0.045 0 -1.25" size="0.025 4.08 0.10" rgba="0.54 0.50 0.44 1" contype="0" conaffinity="0"/>
    </body>
    <body name="home_lab_room_east_wall" pos="4.96 0 1.35">
      <geom name="home_lab_room_east_wall_panel" type="box" size="0.04 4.12 1.35" rgba="0.76 0.75 0.70 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_room_east_wall_baseboard" type="box" pos="-0.045 0 -1.25" size="0.025 4.08 0.10" rgba="0.54 0.50 0.44 1" contype="0" conaffinity="0"/>
    </body>

    <!-- Window and door details give every wall a readable purpose. -->
    <body name="home_lab_west_window" pos="-4.905 -1.12 1.62">
      <geom name="home_lab_west_window_glass" type="box" size="0.012 0.82 0.58" rgba="0.45 0.62 0.68 0.48" contype="0" conaffinity="0"/>
      <geom name="home_lab_west_window_frame_top" type="box" pos="-0.018 0 0.62" size="0.035 0.91 0.045" rgba="0.91 0.90 0.86 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_west_window_frame_bottom" type="box" pos="-0.018 0 -0.62" size="0.035 0.91 0.045" rgba="0.91 0.90 0.86 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_west_window_frame_north" type="box" pos="-0.018 0.87 0" size="0.035 0.045 0.62" rgba="0.91 0.90 0.86 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_west_window_frame_south" type="box" pos="-0.018 -0.87 0" size="0.035 0.045 0.62" rgba="0.91 0.90 0.86 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_west_window_mullion" type="box" pos="-0.025 0 0" size="0.03 0.025 0.58" rgba="0.90 0.89 0.85 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_west_window_sill" type="box" pos="0.07 0 -0.67" size="0.11 0.98 0.04" rgba="0.72 0.67 0.58 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_west_curtain_rod" type="capsule" fromto="0.08 -1.02 0.76 0.08 1.02 0.76" size="0.018" rgba="0.27 0.28 0.27 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_west_curtain_north" type="box" pos="0.09 0.88 0.03" size="0.035 0.20 0.68" rgba="0.55 0.58 0.53 0.92" contype="0" conaffinity="0"/>
      <geom name="home_lab_west_curtain_south" type="box" pos="0.09 -0.88 0.03" size="0.035 0.20 0.68" rgba="0.55 0.58 0.53 0.92" contype="0" conaffinity="0"/>
    </body>
    <body name="home_lab_north_window" pos="-0.7 4.105 1.74">
      <geom name="home_lab_north_window_glass" type="box" size="0.92 0.012 0.51" rgba="0.46 0.62 0.68 0.46" contype="0" conaffinity="0"/>
      <geom name="home_lab_north_window_frame_top" type="box" pos="0 0.018 0.56" size="1.0 0.035 0.045" rgba="0.91 0.90 0.86 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_north_window_frame_bottom" type="box" pos="0 0.018 -0.56" size="1.0 0.035 0.045" rgba="0.91 0.90 0.86 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_north_window_frame_left" type="box" pos="-0.96 0.018 0" size="0.045 0.035 0.56" rgba="0.91 0.90 0.86 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_north_window_frame_right" type="box" pos="0.96 0.018 0" size="0.045 0.035 0.56" rgba="0.91 0.90 0.86 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_north_window_mullion" type="box" pos="0 0.022 0" size="0.025 0.03 0.51" rgba="0.91 0.90 0.86 1" contype="0" conaffinity="0"/>
    </body>
    <body name="home_lab_east_door" pos="4.90 2.65 1.08">
      <geom name="home_lab_east_door_panel" type="box" size="0.035 0.52 1.08" rgba="0.60 0.48 0.36 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_east_door_inset_top" type="box" pos="-0.042 0 0.45" size="0.012 0.40 0.38" rgba="0.69 0.57 0.43 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_east_door_inset_bottom" type="box" pos="-0.042 0 -0.49" size="0.012 0.40 0.38" rgba="0.69 0.57 0.43 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_east_door_handle" type="capsule" fromto="-0.09 -0.29 0.04 -0.09 -0.12 0.04" size="0.024" rgba="0.78 0.69 0.45 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_east_door_frame_top" type="box" pos="0 0 1.13" size="0.07 0.60 0.055" rgba="0.87 0.85 0.79 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_east_door_frame_south" type="box" pos="0 -0.57 0" size="0.07 0.055 1.13" rgba="0.87 0.85 0.79 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_east_door_frame_north" type="box" pos="0 0.57 0" size="0.07 0.055 1.13" rgba="0.87 0.85 0.79 1" contype="0" conaffinity="0"/>
    </body>

    <body name="home_lab_ceiling_light_west" pos="-2.35 0.9 2.58">
      <geom name="home_lab_ceiling_light_west_frame" type="box" size="0.78 0.28 0.035" rgba="0.58 0.57 0.53 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_ceiling_light_west_diffuser" type="box" pos="0 0 -0.04" size="0.70 0.22 0.012" rgba="0.95 0.88 0.69 1" contype="0" conaffinity="0"/>
    </body>
    <body name="home_lab_ceiling_light_east" pos="2.35 0.9 2.58">
      <geom name="home_lab_ceiling_light_east_frame" type="box" size="0.78 0.28 0.035" rgba="0.58 0.57 0.53 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_ceiling_light_east_diffuser" type="box" pos="0 0 -0.04" size="0.70 0.22 0.012" rgba="0.95 0.88 0.69 1" contype="0" conaffinity="0"/>
    </body>

    <!-- West lounge. Sofa faces a low TV wall while keeping the center clear. -->
    <body name="home_lab_lounge_rug" pos="-3.05 1.35 0.012">
      <geom name="home_lab_lounge_rug_surface" type="box" size="1.50 1.18 0.012" rgba="0.42 0.38 0.32 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_lounge_rug_inset" type="box" pos="0 0 0.014" size="1.34 1.02 0.003" rgba="0.57 0.51 0.41 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_lounge_rug_stripe_1" type="box" pos="0 -0.56 0.018" size="1.34 0.025 0.004" rgba="0.75 0.66 0.50 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_lounge_rug_stripe_2" type="box" pos="0 0.56 0.018" size="1.34 0.025 0.004" rgba="0.75 0.66 0.50 1" contype="0" conaffinity="0"/>
    </body>
    <body name="home_lab_sofa" pos="-4.30 1.35 0">
      <geom name="home_lab_sofa_base" type="box" pos="0 0 0.24" size="0.40 0.98 0.18" rgba="0.27 0.33 0.32 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_sofa_front_apron" type="box" pos="0.365 0 0.31" size="0.035 0.80 0.12" rgba="0.31 0.38 0.36 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_sofa_seat_deck" type="box" pos="0.10 0 0.44" size="0.34 0.80 0.04" rgba="0.36 0.43 0.41 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_sofa_seat" type="box" pos="0.13 -0.39 0.55" size="0.30 0.36 0.07" rgba="0.46 0.53 0.50 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_sofa_seat_2" type="box" pos="0.13 0.39 0.55" size="0.30 0.36 0.07" rgba="0.44 0.51 0.48 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_sofa_back" type="box" pos="-0.34 0 0.80" size="0.10 0.98 0.40" rgba="0.32 0.39 0.37 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_sofa_back_cushion_1" type="box" pos="-0.13 -0.39 0.82" size="0.10 0.36 0.28" rgba="0.43 0.50 0.47 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_sofa_back_cushion_2" type="box" pos="-0.13 0.39 0.82" size="0.10 0.36 0.28" rgba="0.42 0.49 0.46 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_sofa_arm_north" type="box" pos="0.03 0.90 0.56" size="0.38 0.08 0.30" rgba="0.30 0.37 0.35 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_sofa_arm_south" type="box" pos="0.03 -0.90 0.56" size="0.38 0.08 0.30" rgba="0.30 0.37 0.35 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_sofa_seam_1" type="capsule" fromto="0.435 -0.75 0.62 0.435 0.75 0.62" size="0.006" rgba="0.27 0.32 0.31 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_sofa_seam_2" type="capsule" fromto="0.435 0 0.49 0.435 0 0.61" size="0.006" rgba="0.27 0.32 0.31 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_sofa_back_seam" type="capsule" fromto="-0.02 0 0.56 -0.02 0 1.08" size="0.006" rgba="0.27 0.32 0.31 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_sofa_leg_1" type="box" pos="-0.27 -0.78 0.08" size="0.045 0.045 0.08" rgba="0.18 0.17 0.15 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_sofa_leg_2" type="box" pos="0.27 -0.78 0.08" size="0.045 0.045 0.08" rgba="0.18 0.17 0.15 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_sofa_leg_3" type="box" pos="-0.27 0.78 0.08" size="0.045 0.045 0.08" rgba="0.18 0.17 0.15 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_sofa_leg_4" type="box" pos="0.27 0.78 0.08" size="0.045 0.045 0.08" rgba="0.18 0.17 0.15 1" contype="0" conaffinity="0"/>
    </body>
    <body name="home_lab_tv_console" pos="-1.82 1.35 0">
      <geom name="home_lab_tv_console_case" type="box" pos="0 0 0.31" size="0.20 1.02 0.31" rgba="0.48 0.38 0.29 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_tv_console_top" type="box" pos="0 0 0.65" size="0.22 1.08 0.035" rgba="0.30 0.27 0.23 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_tv_console_door_1" type="box" pos="-0.208 -0.52 0.34" size="0.010 0.44 0.24" rgba="0.61 0.49 0.36 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_tv_console_door_2" type="box" pos="-0.208 0.52 0.34" size="0.010 0.44 0.24" rgba="0.61 0.49 0.36 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_tv_console_handle_1" type="capsule" fromto="-0.225 -0.76 0.35 -0.225 -0.36 0.35" size="0.008" rgba="0.18 0.19 0.18 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_tv_console_handle_2" type="capsule" fromto="-0.225 0.36 0.35 -0.225 0.76 0.35" size="0.008" rgba="0.18 0.19 0.18 1" contype="0" conaffinity="0"/>
    </body>
    <body name="home_lab_tv" pos="-1.82 1.35 1.20">
      <geom name="home_lab_tv_panel" type="box" size="0.045 0.72 0.42" rgba="0.07 0.08 0.08 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_tv_screen" type="box" pos="-0.050 0 0.01" size="0.007 0.66 0.355" rgba="0.18 0.26 0.29 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_tv_screen_horizon" type="box" pos="-0.059 0 -0.08" size="0.003 0.52 0.07" rgba="0.40 0.48 0.42 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_tv_stand" type="box" pos="0 0 -0.48" size="0.09 0.22 0.035" rgba="0.13 0.14 0.14 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_tv_neck" type="box" pos="0 0 -0.42" size="0.035 0.035 0.08" rgba="0.13 0.14 0.14 1" contype="0" conaffinity="0"/>
    </body>
    <body name="home_lab_tv_left_speaker" pos="-1.88 0.43 0.965">
      <geom name="home_lab_tv_left_speaker_case" type="box" size="0.12 0.10 0.28" rgba="0.12 0.13 0.13 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_tv_left_speaker_driver_1" type="cylinder" pos="-0.105 0 0.10" size="0.055 0.010" euler="0 90 0" rgba="0.35 0.36 0.34 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_tv_left_speaker_driver_2" type="cylinder" pos="-0.105 0 -0.11" size="0.075 0.010" euler="0 90 0" rgba="0.27 0.28 0.27 1" contype="0" conaffinity="0"/>
    </body>
    <body name="home_lab_tv_right_speaker" pos="-1.88 2.27 0.965">
      <geom name="home_lab_tv_right_speaker_case" type="box" size="0.12 0.10 0.28" rgba="0.12 0.13 0.13 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_tv_right_speaker_driver_1" type="cylinder" pos="-0.105 0 0.10" size="0.055 0.010" euler="0 90 0" rgba="0.35 0.36 0.34 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_tv_right_speaker_driver_2" type="cylinder" pos="-0.105 0 -0.11" size="0.075 0.010" euler="0 90 0" rgba="0.27 0.28 0.27 1" contype="0" conaffinity="0"/>
    </body>
    <body name="home_lab_coffee_table" pos="-2.95 1.35 0">
      <geom name="home_lab_coffee_table_top" type="box" pos="0 0 0.48" size="0.47 0.65 0.035" rgba="0.53 0.42 0.31 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_coffee_table_lower_shelf" type="box" pos="0 0 0.18" size="0.42 0.58 0.025" rgba="0.42 0.34 0.27 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_coffee_table_leg_1" type="box" pos="-0.38 -0.55 0.25" size="0.035 0.035 0.25" rgba="0.22 0.22 0.20 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_coffee_table_leg_2" type="box" pos="-0.38 0.55 0.25" size="0.035 0.035 0.25" rgba="0.22 0.22 0.20 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_coffee_table_leg_3" type="box" pos="0.38 -0.55 0.25" size="0.035 0.035 0.25" rgba="0.22 0.22 0.20 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_coffee_table_leg_4" type="box" pos="0.38 0.55 0.25" size="0.035 0.035 0.25" rgba="0.22 0.22 0.20 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_tv_remote" type="box" pos="0.05 -0.20 0.53" size="0.055 0.14 0.018" euler="0 0 -12" rgba="0.12 0.13 0.13 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_tv_remote_button" type="cylinder" pos="0.05 -0.20 0.55" size="0.012 0.004" rgba="0.65 0.24 0.18 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_coffee_mug" type="cylinder" pos="-0.20 0.25 0.59" size="0.070 0.075" rgba="0.79 0.73 0.62 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_coffee_mug_rim" type="cylinder" pos="-0.20 0.25 0.67" size="0.073 0.009" rgba="0.88 0.84 0.76 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_coffee_mug_opening" type="cylinder" pos="-0.20 0.25 0.681" size="0.056 0.004" rgba="0.20 0.15 0.11 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_coffee_mug_handle_top" type="capsule" fromto="-0.20 0.312 0.65 -0.20 0.355 0.63" size="0.010" rgba="0.79 0.73 0.62 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_coffee_mug_handle_side" type="capsule" fromto="-0.20 0.355 0.63 -0.20 0.355 0.57" size="0.010" rgba="0.79 0.73 0.62 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_coffee_mug_handle_bottom" type="capsule" fromto="-0.20 0.355 0.57 -0.20 0.312 0.55" size="0.010" rgba="0.79 0.73 0.62 1" contype="0" conaffinity="0"/>
    </body>
    <body name="home_lab_side_table" pos="-4.30 2.85 0">
      <geom name="home_lab_side_table_top" type="cylinder" pos="0 0 0.53" size="0.30 0.035" rgba="0.52 0.42 0.32 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_side_table_post" type="cylinder" pos="0 0 0.28" size="0.042 0.25" rgba="0.23 0.22 0.20 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_side_table_foot" type="cylinder" pos="0 0 0.03" size="0.21 0.03" rgba="0.20 0.19 0.17 1" contype="0" conaffinity="0"/>
    </body>
    <body name="home_lab_floor_lamp" pos="-4.52 3.54 0">
      <geom name="home_lab_floor_lamp_base" type="cylinder" pos="0 0 0.035" size="0.18 0.035" rgba="0.20 0.20 0.19 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_floor_lamp_pole" type="capsule" fromto="0 0 0.06 0 0 1.54" size="0.024" rgba="0.31 0.30 0.28 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_floor_lamp_shade" type="cylinder" pos="0 0 1.60" size="0.24 0.22" rgba="0.67 0.60 0.49 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_floor_lamp_diffuser" type="cylinder" pos="0 0 1.39" size="0.15 0.010" rgba="0.94 0.83 0.62 1" contype="0" conaffinity="0"/>
    </body>

    <!-- Northeast dual-screen office. -->
    <body name="home_lab_office_desk" pos="2.65 3.42 0">
      <geom name="home_lab_office_desk_top" type="box" pos="0 0 0.78" size="1.12 0.39 0.045" rgba="0.56 0.45 0.33 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_office_desk_edge" type="box" pos="0 -0.39 0.75" size="1.12 0.025 0.065" rgba="0.39 0.32 0.25 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_office_desk_leg_1" type="box" pos="-0.96 -0.26 0.38" size="0.045 0.045 0.38" rgba="0.20 0.21 0.20 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_office_desk_leg_2" type="box" pos="0.96 -0.26 0.38" size="0.045 0.045 0.38" rgba="0.20 0.21 0.20 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_office_desk_leg_3" type="box" pos="-0.96 0.26 0.38" size="0.045 0.045 0.38" rgba="0.20 0.21 0.20 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_office_desk_leg_4" type="box" pos="0.96 0.26 0.38" size="0.045 0.045 0.38" rgba="0.20 0.21 0.20 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_keyboard" type="box" pos="-0.05 -0.18 0.845" size="0.33 0.11 0.018" rgba="0.14 0.15 0.15 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_keyboard_keybed" type="box" pos="-0.05 -0.19 0.866" size="0.29 0.088 0.005" rgba="0.34 0.35 0.33 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_mouse_pad" type="box" pos="0.51 -0.18 0.835" size="0.18 0.15 0.006" rgba="0.24 0.27 0.26 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_mouse" type="ellipsoid" pos="0.51 -0.18 0.866" size="0.045 0.065 0.025" rgba="0.14 0.15 0.15 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_desk_book_1" type="box" pos="0.82 0.08 0.85" size="0.18 0.13 0.025" euler="0 0 4" rgba="0.60 0.33 0.25 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_desk_book_2" type="box" pos="0.80 0.08 0.90" size="0.17 0.12 0.020" euler="0 0 -5" rgba="0.31 0.45 0.44 1" contype="0" conaffinity="0"/>
      <body name="home_lab_monitor_left" pos="-0.43 0.0 1.21">
        <geom name="home_lab_monitor_left_panel" type="box" size="0.36 0.035 0.25" rgba="0.08 0.09 0.09 1" contype="0" conaffinity="0"/>
        <geom name="home_lab_monitor_left_screen" type="box" pos="0 -0.040 0.01" size="0.32 0.006 0.21" rgba="0.24 0.38 0.42 1" contype="0" conaffinity="0"/>
        <geom name="home_lab_monitor_left_window" type="box" pos="-0.11 -0.048 0.04" size="0.16 0.003 0.11" rgba="0.52 0.62 0.59 1" contype="0" conaffinity="0"/>
        <geom name="home_lab_monitor_left_neck" type="box" pos="0 0 -0.30" size="0.034 0.034 0.08" rgba="0.15 0.16 0.16 1" contype="0" conaffinity="0"/>
        <geom name="home_lab_monitor_left_foot" type="box" pos="0 0 -0.38" size="0.18 0.13 0.024" rgba="0.15 0.16 0.16 1" contype="0" conaffinity="0"/>
      </body>
      <body name="home_lab_monitor_right" pos="0.35 0.0 1.21">
        <geom name="home_lab_monitor_right_panel" type="box" size="0.36 0.035 0.25" rgba="0.08 0.09 0.09 1" contype="0" conaffinity="0"/>
        <geom name="home_lab_monitor_right_screen" type="box" pos="0 -0.040 0.01" size="0.32 0.006 0.21" rgba="0.35 0.38 0.32 1" contype="0" conaffinity="0"/>
        <geom name="home_lab_monitor_right_chart_1" type="box" pos="-0.17 -0.048 -0.06" size="0.025 0.003 0.08" rgba="0.75 0.57 0.30 1" contype="0" conaffinity="0"/>
        <geom name="home_lab_monitor_right_chart_2" type="box" pos="-0.08 -0.048 -0.02" size="0.025 0.003 0.12" rgba="0.55 0.68 0.53 1" contype="0" conaffinity="0"/>
        <geom name="home_lab_monitor_right_chart_3" type="box" pos="0.01 -0.048 0.02" size="0.025 0.003 0.16" rgba="0.42 0.60 0.67 1" contype="0" conaffinity="0"/>
        <geom name="home_lab_monitor_right_neck" type="box" pos="0 0 -0.30" size="0.034 0.034 0.08" rgba="0.15 0.16 0.16 1" contype="0" conaffinity="0"/>
        <geom name="home_lab_monitor_right_foot" type="box" pos="0 0 -0.38" size="0.18 0.13 0.024" rgba="0.15 0.16 0.16 1" contype="0" conaffinity="0"/>
      </body>
    </body>
    <body name="home_lab_pc_tower" pos="3.62 3.28 0.40">
      <geom name="home_lab_pc_case" type="box" size="0.18 0.30 0.40" rgba="0.16 0.17 0.17 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_pc_glass" type="box" pos="-0.185 0 0" size="0.008 0.26 0.35" rgba="0.22 0.31 0.31 0.72" contype="0" conaffinity="0"/>
      <geom name="home_lab_pc_vent_1" type="cylinder" pos="0 -0.305 0.18" size="0.095 0.010" euler="90 0 0" rgba="0.32 0.37 0.35 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_pc_vent_2" type="cylinder" pos="0 -0.305 -0.12" size="0.095 0.010" euler="90 0 0" rgba="0.32 0.37 0.35 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_pc_power" type="cylinder" pos="0.08 -0.312 0.32" size="0.018 0.006" euler="90 0 0" rgba="0.58 0.74 0.58 1" contype="0" conaffinity="0"/>
    </body>
    <body name="home_lab_cable_tray" pos="2.65 3.54 0.62">
      <geom name="home_lab_cable_tray_rail" type="box" size="0.72 0.08 0.035" rgba="0.20 0.21 0.20 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_cable_1" type="capsule" fromto="-0.52 -0.02 0 -0.05 -0.02 0" size="0.012" rgba="0.11 0.12 0.12 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_cable_2" type="capsule" fromto="0.05 0.02 0 0.58 0.02 0" size="0.010" rgba="0.16 0.17 0.16 1" contype="0" conaffinity="0"/>
    </body>
    <body name="home_lab_office_chair" pos="2.65 2.45 0">
      <geom name="home_lab_office_chair_base" type="cylinder" pos="0 0 0.08" size="0.28 0.035" rgba="0.16 0.17 0.17 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_office_chair_post" type="cylinder" pos="0 0 0.30" size="0.04 0.20" rgba="0.25 0.26 0.25 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_office_chair_seat" type="box" pos="0 0 0.52" size="0.36 0.34 0.07" rgba="0.28 0.33 0.33 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_office_chair_back" type="box" pos="0 0.29 0.91" size="0.36 0.07 0.36" euler="-8 0 0" rgba="0.25 0.30 0.30 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_office_chair_mesh_1" type="capsule" fromto="-0.27 0.215 0.70 0.27 0.215 0.70" size="0.009" rgba="0.45 0.49 0.47 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_office_chair_mesh_2" type="capsule" fromto="-0.27 0.225 0.90 0.27 0.225 0.90" size="0.009" rgba="0.45 0.49 0.47 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_office_chair_arm_support_front_left" type="capsule" fromto="-0.40 -0.20 0.59 -0.40 -0.20 0.72" size="0.022" rgba="0.19 0.20 0.20 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_office_chair_arm_support_rear_left" type="capsule" fromto="-0.40 0.12 0.59 -0.40 0.12 0.72" size="0.022" rgba="0.19 0.20 0.20 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_office_chair_arm_support_front_right" type="capsule" fromto="0.40 -0.20 0.59 0.40 -0.20 0.72" size="0.022" rgba="0.19 0.20 0.20 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_office_chair_arm_support_rear_right" type="capsule" fromto="0.40 0.12 0.59 0.40 0.12 0.72" size="0.022" rgba="0.19 0.20 0.20 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_office_chair_arm_rail_left" type="box" pos="-0.40 -0.04 0.755" size="0.055 0.22 0.035" rgba="0.18 0.20 0.20 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_office_chair_arm_rail_right" type="box" pos="0.40 -0.04 0.755" size="0.055 0.22 0.035" rgba="0.18 0.20 0.20 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_office_chair_arm_pad_left" type="box" pos="-0.40 -0.04 0.795" size="0.062 0.205 0.015" rgba="0.37 0.43 0.42 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_office_chair_arm_pad_right" type="box" pos="0.40 -0.04 0.795" size="0.062 0.205 0.015" rgba="0.37 0.43 0.42 1" contype="0" conaffinity="0"/>
    </body>
    <body name="home_lab_wall_organizer" pos="2.62 4.105 1.83">
      <geom name="home_lab_wall_organizer_board" type="box" size="0.78 0.015 0.38" rgba="0.35 0.38 0.36 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_wall_organizer_note_1" type="box" pos="-0.42 -0.020 0.11" size="0.16 0.005 0.11" rgba="0.76 0.66 0.42 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_wall_organizer_note_2" type="box" pos="0.03 -0.020 -0.09" size="0.19 0.005 0.13" rgba="0.49 0.65 0.62 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_wall_organizer_note_3" type="box" pos="0.46 -0.020 0.08" size="0.15 0.005 0.15" rgba="0.72 0.50 0.39 1" contype="0" conaffinity="0"/>
    </body>
    <body name="home_lab_room_art_1" pos="-3.42 4.105 1.78">
      <geom name="home_lab_room_art_1_frame" type="box" size="0.56 0.014 0.38" rgba="0.25 0.22 0.18 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_room_art_1_canvas" type="box" pos="0 -0.018 0" size="0.49 0.006 0.31" rgba="0.42 0.50 0.44 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_room_art_1_accent" type="box" pos="0.12 -0.026 -0.04" size="0.23 0.003 0.075" euler="0 0 18" rgba="0.67 0.53 0.36 1" contype="0" conaffinity="0"/>
    </body>
    <body name="home_lab_room_art_2" pos="0.62 4.105 1.62">
      <geom name="home_lab_room_art_2_frame" type="box" size="0.36 0.014 0.43" rgba="0.25 0.22 0.19 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_room_art_2_canvas" type="box" pos="0 -0.018 0" size="0.30 0.006 0.36" rgba="0.54 0.46 0.37 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_room_art_2_circle" type="cylinder" pos="0 -0.026 0.04" size="0.13 0.003" euler="90 0 0" rgba="0.31 0.42 0.42 1" contype="0" conaffinity="0"/>
    </body>

    <!-- Southeast robot service area. Mobile robots stand directly on the floor. -->
    <body name="home_lab_g1_status_pedestal" pos="1.63 -1.55 0">
      <geom name="home_lab_g1_status_pedestal_base" type="cylinder" pos="0 0 0.05" size="0.20 0.05" rgba="0.24 0.25 0.24 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_g1_status_pedestal_post" type="box" pos="0 0 0.47" size="0.08 0.08 0.38" rgba="0.34 0.36 0.34 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_g1_status_pedestal_screen" type="box" pos="0 -0.025 0.93" size="0.24 0.06 0.16" euler="-16 0 0" rgba="0.18 0.32 0.32 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_g1_status_pedestal_indicator" type="cylinder" pos="0 -0.09 0.98" size="0.025 0.008" euler="90 0 0" rgba="0.55 0.78 0.53 1" contype="0" conaffinity="0"/>
    </body>
    <body name="home_lab_robot_warning_band_1" pos="1.45 -2.95 0.006">
      <geom name="home_lab_robot_warning_band_1_strip" type="box" size="0.60 0.025 0.006" euler="0 0 28" rgba="0.83 0.62 0.24 1" contype="0" conaffinity="0"/>
    </body>
    <body name="home_lab_robot_warning_band_2" pos="2.14 -3.30 0.006">
      <geom name="home_lab_robot_warning_band_2_strip" type="box" size="0.60 0.025 0.006" euler="0 0 28" rgba="0.83 0.62 0.24 1" contype="0" conaffinity="0"/>
    </body>
    <body name="home_lab_maintenance_cabinet" pos="4.56 -0.15 0">
      <geom name="home_lab_maintenance_cabinet_case" type="box" pos="0 0 0.88" size="0.32 0.65 0.88" rgba="0.43 0.47 0.45 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_maintenance_cabinet_top" type="box" pos="0 0 1.79" size="0.35 0.68 0.035" rgba="0.25 0.28 0.27 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_maintenance_cabinet_door" type="box" pos="-0.33 0 1.25" size="0.015 0.59 0.43" rgba="0.52 0.57 0.54 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_maintenance_cabinet_door_handle" type="capsule" fromto="-0.36 -0.38 1.22 -0.36 -0.12 1.22" size="0.012" rgba="0.18 0.19 0.19 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_maintenance_drawer_1" type="box" pos="-0.33 0 0.74" size="0.015 0.59 0.16" rgba="0.58 0.61 0.58 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_maintenance_drawer_2" type="box" pos="-0.33 0 0.40" size="0.015 0.59 0.16" rgba="0.55 0.59 0.56 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_maintenance_drawer_3" type="box" pos="-0.33 0 0.11" size="0.015 0.59 0.12" rgba="0.52 0.56 0.53 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_maintenance_drawer_handle_1" type="capsule" fromto="-0.36 -0.17 0.74 -0.36 0.17 0.74" size="0.010" rgba="0.19 0.20 0.20 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_maintenance_drawer_handle_2" type="capsule" fromto="-0.36 -0.17 0.40 -0.36 0.17 0.40" size="0.010" rgba="0.19 0.20 0.20 1" contype="0" conaffinity="0"/>
    </body>
    <body name="home_lab_tool_board" pos="4.905 -1.08 1.62">
      <geom name="home_lab_tool_board_panel" type="box" size="0.018 0.62 0.48" rgba="0.32 0.37 0.35 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_tool_board_rail_1" type="capsule" fromto="-0.025 -0.50 0.36 -0.025 0.50 0.36" size="0.012" rgba="0.61 0.64 0.59 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_tool_wrench" type="capsule" fromto="-0.045 -0.31 0.25 -0.045 -0.31 -0.22" size="0.025" rgba="0.67 0.68 0.64 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_tool_wrench_head_left" type="capsule" fromto="-0.045 -0.31 0.27 -0.045 -0.36 0.34" size="0.018" rgba="0.67 0.68 0.64 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_tool_wrench_head_right" type="capsule" fromto="-0.045 -0.31 0.27 -0.045 -0.26 0.34" size="0.018" rgba="0.67 0.68 0.64 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_tool_screwdriver_shaft" type="capsule" fromto="-0.045 0.02 0.22 -0.045 0.02 -0.17" size="0.014" rgba="0.68 0.69 0.66 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_tool_screwdriver_handle" type="cylinder" pos="-0.045 0.02 -0.27" size="0.05 0.12" rgba="0.66 0.38 0.25 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_tool_hammer_handle" type="capsule" fromto="-0.045 0.35 0.20 -0.045 0.35 -0.27" size="0.025" rgba="0.50 0.35 0.24 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_tool_hammer_head" type="box" pos="-0.045 0.35 0.25" size="0.035 0.14 0.06" rgba="0.31 0.32 0.31 1" contype="0" conaffinity="0"/>
    </body>
    <body name="home_lab_service_cart" pos="4.12 -3.34 0">
      <geom name="home_lab_service_cart_lower_shelf" type="box" pos="0 0 0.28" size="0.42 0.55 0.035" rgba="0.36 0.42 0.40 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_service_cart_upper_shelf" type="box" pos="0 0 0.82" size="0.42 0.55 0.035" rgba="0.46 0.51 0.48 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_service_cart_post_1" type="capsule" fromto="-0.35 -0.48 0.15 -0.35 -0.48 0.80" size="0.025" rgba="0.23 0.25 0.24 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_service_cart_post_2" type="capsule" fromto="-0.35 0.48 0.15 -0.35 0.48 0.80" size="0.025" rgba="0.23 0.25 0.24 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_service_cart_post_3" type="capsule" fromto="0.35 -0.48 0.15 0.35 -0.48 0.80" size="0.025" rgba="0.23 0.25 0.24 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_service_cart_post_4" type="capsule" fromto="0.35 0.48 0.15 0.35 0.48 0.80" size="0.025" rgba="0.23 0.25 0.24 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_service_cart_wheel_1" type="cylinder" pos="-0.35 -0.48 0.075" size="0.075 0.03" euler="90 0 0" rgba="0.10 0.11 0.11 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_service_cart_wheel_2" type="cylinder" pos="0.35 -0.48 0.075" size="0.075 0.03" euler="90 0 0" rgba="0.10 0.11 0.11 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_service_cart_wheel_3" type="cylinder" pos="-0.35 0.48 0.075" size="0.075 0.03" euler="90 0 0" rgba="0.10 0.11 0.11 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_service_cart_wheel_4" type="cylinder" pos="0.35 0.48 0.075" size="0.075 0.03" euler="90 0 0" rgba="0.10 0.11 0.11 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_service_cart_bin_1" type="box" pos="-0.20 0 0.91" size="0.16 0.22 0.08" rgba="0.68 0.58 0.39 1" contype="0" conaffinity="0"/>
      <geom name="home_lab_service_cart_bin_2" type="box" pos="0.20 0 0.91" size="0.16 0.22 0.08" rgba="0.38 0.56 0.57 1" contype="0" conaffinity="0"/>
    </body>`;

export const SO101_HOME_LAB_STATIC_ROBOTS_XML = `
    <body name="home_lab_g1_mobile_root" pos="2.45 -0.9 0">
      <inertial pos="0 0 0.4" mass="0.001" diaginertia="0.001 0.001 0.001"/>
      <joint name="home_lab_g1_x" type="slide" axis="1 0 0" range="-6.6 1.7" damping="8"/>
      <joint name="home_lab_g1_y" type="slide" axis="0 1 0" range="-2.5 4.2" damping="8"/>
      <joint name="home_lab_g1_yaw" type="hinge" axis="0 0 1" range="-3.14159 3.14159" damping="4"/>
      <frame euler="0 0 155"><attach model="g1_room_model" body="pelvis" prefix="room_g1_"/></frame>
    </body>
    <body name="home_lab_go2_mobile_root" pos="3.55 -2.35 0">
      <inertial pos="0 0 0.3" mass="0.001" diaginertia="0.001 0.001 0.001"/>
      <joint name="home_lab_go2_x" type="slide" axis="1 0 0" range="-7.7 0.6" damping="5"/>
      <joint name="home_lab_go2_y" type="slide" axis="0 1 0" range="-1.0 5.6" damping="5"/>
      <joint name="home_lab_go2_yaw" type="hinge" axis="0 0 1" range="-3.14159 3.14159" damping="3"/>
      <frame euler="0 0 150"><attach model="go2_arm_room_model" body="base" prefix="room_go2_"/></frame>
    </body>`;

export const SO101_HOME_LAB_MOBILE_ACTUATORS_XML = `
  <actuator>
    <velocity name="home_lab_g1_velocity_x" joint="home_lab_g1_x" kv="55" ctrlrange="-0.6 0.6"/>
    <velocity name="home_lab_g1_velocity_y" joint="home_lab_g1_y" kv="55" ctrlrange="-0.6 0.6"/>
    <velocity name="home_lab_g1_velocity_yaw" joint="home_lab_g1_yaw" kv="35" ctrlrange="-1.0 1.0"/>
    <velocity name="home_lab_go2_velocity_x" joint="home_lab_go2_x" kv="40" ctrlrange="-0.6 0.6"/>
    <velocity name="home_lab_go2_velocity_y" joint="home_lab_go2_y" kv="40" ctrlrange="-0.6 0.6"/>
    <velocity name="home_lab_go2_velocity_yaw" joint="home_lab_go2_yaw" kv="25" ctrlrange="-1.0 1.0"/>
  </actuator>`;
